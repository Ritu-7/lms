/**
 * notificationService.js
 *
 * Centralized service for creating and querying notifications.
 * All notification creation across the LMS goes through this file.
 *
 * Key design decisions:
 *  - Deduplication: avoid creating duplicate notifications for the same
 *    event within a 24-hour window.
 *  - Fire-and-forget: all public helpers swallow errors so that a notification
 *    failure never breaks the primary request flow.
 *  - Broadcast helpers: fan-out to all users matching a role in one DB write
 *    using isBroadcast + recipientRole (no per-user fan-out needed).
 */

import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

// ─── Type / icon maps ────────────────────────────────────────────────────────

const TYPE_ICONS = {
  course: "📚",
  assignment: "📝",
  quiz: "🧪",
  announcement: "📢",
  enrollment: "🎓",
  certificate: "🏆",
  payment: "💳",
  AI: "🤖",
  system: "🔔",
};

// ─── Core creator ─────────────────────────────────────────────────────────────

/**
 * createNotification — the single entry-point for persisting a notification.
 *
 * @param {Object} opts
 * @param {string|null}  opts.recipient      MongoDB User _id (null for broadcast)
 * @param {string|null}  opts.recipientRole  "student"|"educator"|"admin"|"all"
 * @param {boolean}      opts.isBroadcast    true = fan out to recipientRole
 * @param {string|null}  opts.sender         MongoDB User _id of creator (null = system)
 * @param {string}       opts.senderLabel    Display name for sender
 * @param {string}       opts.title
 * @param {string}       opts.message
 * @param {string}       opts.type           see Notification model enum
 * @param {string}       opts.priority       "low"|"medium"|"high"
 * @param {string|null}  opts.actionUrl
 * @param {string|null}  opts.icon
 * @param {Object}       opts.metadata       arbitrary extra data, includes refId for dedup
 * @param {Date|null}    opts.expiresAt
 * @param {boolean}      opts.skipDedup      set true to bypass deduplication check
 * @returns {Promise<Notification>}
 */
export const createNotification = async ({
  recipient = null,
  recipientRole = null,
  isBroadcast = false,
  sender = null,
  senderLabel = "System",
  title,
  message,
  type = "system",
  priority = "low",
  actionUrl = null,
  icon = null,
  metadata = {},
  expiresAt = null,
  skipDedup = false,
}) => {
  try {
    // ── Deduplication check ──────────────────────────────────────────────
    if (!skipDedup && recipient && metadata?.refId) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await Notification.findOne({
        recipient,
        type,
        "metadata.refId": metadata.refId,
        isRead: false,
        createdAt: { $gte: since },
      }).lean();

      if (existing) {
        logger.info("notification.dedup_skipped", {
          recipient: recipient?.toString(),
          type,
          refId: metadata.refId,
        });
        return existing;
      }
    }

    const notification = await Notification.create({
      recipient,
      recipientRole,
      isBroadcast,
      sender,
      senderLabel,
      title,
      message,
      type,
      priority,
      actionUrl,
      icon: icon || TYPE_ICONS[type] || "🔔",
      metadata,
      expiresAt,
    });

    logger.info("notification.created", {
      id: notification._id.toString(),
      type,
      isBroadcast,
      recipient: recipient?.toString(),
      recipientRole,
    });

    return notification;
  } catch (error) {
    logger.error("notification.create_failed", { message: error.message, type });
    throw error;
  }
};

// ─── Safe wrapper (fire-and-forget) ──────────────────────────────────────────

/**
 * safeNotify — wraps createNotification so errors never bubble up to callers.
 * Use this inside controllers to avoid breaking the main response flow.
 */
const safeNotify = async (opts) => {
  try {
    await createNotification(opts);
  } catch (err) {
    logger.warn("notification.safe_notify_failed", { message: err.message });
  }
};

// ─── Event-specific helpers ───────────────────────────────────────────────────

/**
 * notifyEnrollment — student enrolled in a course.
 */
export const notifyEnrollment = (userId, courseId, courseTitle) =>
  safeNotify({
    recipient: userId,
    title: "Enrolled Successfully! 🎉",
    message: `You are now enrolled in "${courseTitle}". Start learning today!`,
    type: "enrollment",
    priority: "medium",
    actionUrl: `/player/${courseId}`,
    metadata: { refId: `enroll_${userId}_${courseId}`, courseId: courseId?.toString() },
  });

/**
 * notifyPaymentSuccess — payment for a course completed.
 */
export const notifyPaymentSuccess = (userId, courseId, courseTitle, amount) =>
  safeNotify({
    recipient: userId,
    title: "Payment Successful 💳",
    message: `Your payment of ₹${amount} for "${courseTitle}" was successful. You are now enrolled!`,
    type: "payment",
    priority: "high",
    actionUrl: `/my-enrollments`,
    metadata: { refId: `payment_${userId}_${courseId}`, courseId: courseId?.toString(), amount },
  });

/**
 * notifyRefund — refund processed.
 */
export const notifyRefund = (userId, courseId, courseTitle, amount) =>
  safeNotify({
    recipient: userId,
    title: "Refund Processed 💰",
    message: `Your refund of ₹${amount} for "${courseTitle}" has been processed.`,
    type: "payment",
    priority: "high",
    actionUrl: `/my-enrollments`,
    metadata: { refId: `refund_${userId}_${courseId}`, courseId: courseId?.toString(), amount },
    skipDedup: true,
  });

/**
 * notifyCertificate — certificate generated for course completion.
 */
export const notifyCertificate = (userId, courseId, courseTitle, certificateId) =>
  safeNotify({
    recipient: userId,
    title: "Certificate Earned! 🏆",
    message: `Congratulations! You earned a certificate for completing "${courseTitle}".`,
    type: "certificate",
    priority: "high",
    actionUrl: `/my-enrollments`,
    metadata: {
      refId: `cert_${userId}_${courseId}`,
      courseId: courseId?.toString(),
      certificateId: certificateId?.toString(),
    },
  });

/**
 * notifyCoursePublished — course became publicly available.
 * Notifies enrolled students + sends to educator as confirmation.
 */
export const notifyCoursePublished = async (educatorId, courseId, courseTitle, enrolledStudentIds = []) => {
  // Notify the educator
  await safeNotify({
    recipient: educatorId,
    sender: educatorId,
    title: "Course Published ✅",
    message: `Your course "${courseTitle}" is now live and available to students.`,
    type: "course",
    priority: "medium",
    actionUrl: `/educator/my-courses`,
    metadata: { refId: `pub_educator_${educatorId}_${courseId}`, courseId: courseId?.toString() },
  });

  // Notify each enrolled student (if any are already enrolled)
  for (const studentId of enrolledStudentIds) {
    await safeNotify({
      recipient: studentId,
      title: "Course Updated 📚",
      message: `"${courseTitle}" has been updated and is now available.`,
      type: "course",
      priority: "low",
      actionUrl: `/player/${courseId}`,
      metadata: { refId: `pub_student_${studentId}_${courseId}`, courseId: courseId?.toString() },
    });
  }
};

/**
 * notifyNewEnrollmentToEducator — student enrolled in educator's course.
 */
export const notifyNewEnrollmentToEducator = (educatorId, studentName, courseId, courseTitle) =>
  safeNotify({
    recipient: educatorId,
    title: "New Student Enrolled 🎓",
    message: `${studentName} just enrolled in "${courseTitle}".`,
    type: "enrollment",
    priority: "medium",
    actionUrl: `/educator/student-enrolled`,
    metadata: {
      refId: `enroll_educator_${educatorId}_${courseId}_${studentName}`,
      courseId: courseId?.toString(),
      studentName,
    },
  });

/**
 * notifyAssignmentCreated — assignment published for a course.
 * Notifies all enrolled students.
 */
export const notifyAssignmentCreated = async (enrolledStudentIds = [], courseId, assignmentId, assignmentTitle) => {
  for (const studentId of enrolledStudentIds) {
    await safeNotify({
      recipient: studentId,
      title: "New Assignment Posted 📝",
      message: `A new assignment "${assignmentTitle}" has been posted. Check it out!`,
      type: "assignment",
      priority: "medium",
      actionUrl: `/assignments`,
      metadata: {
        refId: `asgn_created_${studentId}_${assignmentId}`,
        courseId: courseId?.toString(),
        assignmentId: assignmentId?.toString(),
      },
    });
  }
};

/**
 * notifyAssignmentGraded — assignment submission was graded.
 */
export const notifyAssignmentGraded = (studentId, assignmentId, assignmentTitle, grade) =>
  safeNotify({
    recipient: studentId,
    title: "Assignment Graded ✅",
    message: `Your submission for "${assignmentTitle}" has been graded. Score: ${grade}.`,
    type: "assignment",
    priority: "high",
    actionUrl: `/assignments`,
    metadata: {
      refId: `asgn_graded_${studentId}_${assignmentId}`,
      assignmentId: assignmentId?.toString(),
      grade,
    },
    skipDedup: true,
  });

/**
 * notifyNewSubmissionToEducator — student submitted an assignment.
 */
export const notifyNewSubmissionToEducator = (educatorId, studentName, assignmentId, assignmentTitle) =>
  safeNotify({
    recipient: educatorId,
    title: "New Submission Received 📬",
    message: `${studentName} submitted "${assignmentTitle}". Ready to review.`,
    type: "assignment",
    priority: "medium",
    actionUrl: `/educator/assignments`,
    metadata: {
      refId: `submission_${educatorId}_${assignmentId}_${studentName}`,
      assignmentId: assignmentId?.toString(),
      studentName,
    },
  });

/**
 * notifyQuizAvailable — quiz became available for enrolled students.
 */
export const notifyQuizAvailable = async (enrolledStudentIds = [], courseId, quizId, quizTitle) => {
  for (const studentId of enrolledStudentIds) {
    await safeNotify({
      recipient: studentId,
      title: "New Quiz Available 🧪",
      message: `A new quiz "${quizTitle}" is now available. Good luck!`,
      type: "quiz",
      priority: "medium",
      actionUrl: `/quiz/${quizId}`,
      metadata: {
        refId: `quiz_avail_${studentId}_${quizId}`,
        courseId: courseId?.toString(),
        quizId: quizId?.toString(),
      },
    });
  }
};

/**
 * notifyQuizResult — quiz attempt graded/auto-evaluated.
 */
export const notifyQuizResult = (studentId, quizId, quizTitle, passed, percentage) =>
  safeNotify({
    recipient: studentId,
    title: passed ? "Quiz Passed! 🎉" : "Quiz Completed 📊",
    message: passed
      ? `You passed "${quizTitle}" with ${percentage}%! Great work!`
      : `Your quiz "${quizTitle}" was graded. Score: ${percentage}%. Keep going!`,
    type: "quiz",
    priority: "medium",
    actionUrl: `/quiz/${quizId}`,
    metadata: {
      refId: `quiz_result_${studentId}_${quizId}_${Date.now()}`,
      quizId: quizId?.toString(),
      passed,
      percentage,
    },
    skipDedup: true,
  });

/**
 * notifyAdminAnnouncement — admin created an announcement.
 * Creates a single broadcast notification for the given audience.
 */
export const notifyAdminAnnouncement = (announcementId, title, message, audience = "all", senderId = null) =>
  safeNotify({
    isBroadcast: true,
    recipientRole: audience === "all" ? "all" : audience, // "students","educators","admins" → map
    sender: senderId,
    senderLabel: "Admin",
    title: `📢 ${title}`,
    message,
    type: "announcement",
    priority: "medium",
    actionUrl: null,
    metadata: { refId: `announcement_${announcementId}`, announcementId: announcementId?.toString() },
    skipDedup: true,
  });

/**
 * notifyAICreditsLow — future-ready stub for when AI credits run low.
 */
export const notifyAICreditsLow = (userId, remainingCredits) =>
  safeNotify({
    recipient: userId,
    title: "AI Credits Running Low 🤖",
    message: `You have ${remainingCredits} AI credits remaining. Consider upgrading your plan.`,
    type: "AI",
    priority: "high",
    actionUrl: null,
    metadata: { refId: `ai_credits_${userId}`, remainingCredits },
  });

// ─── Query helpers ────────────────────────────────────────────────────────────

/**
 * getNotificationsForUser — fetch paginated notifications for a user.
 * Merges personal + broadcast notifications and sorts by createdAt desc.
 *
 * @param {string}  userId        MongoDB User _id
 * @param {string}  userRole      "student"|"educator"|"admin"
 * @param {Object}  opts
 * @param {number}  opts.page
 * @param {number}  opts.limit
 * @param {string}  opts.type     filter by notification type
 * @param {boolean} opts.unreadOnly
 */
export const getNotificationsForUser = async (userId, userRole, { page = 1, limit = 20, type, unreadOnly } = {}) => {
  const skip = (page - 1) * limit;
  const now = new Date();

  // Build OR query: personal OR (broadcast matching role OR broadcast to "all")
  const roleFilter = [{ recipientRole: userRole }, { recipientRole: "all" }];

  const baseFilter = {
    $or: [
      { recipient: userId },
      { isBroadcast: true, $or: roleFilter },
    ],
    // Exclude expired
    $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }],
  };

  if (type) baseFilter.type = type;
  if (unreadOnly) baseFilter.isRead = false;

  const [notifications, total] = await Promise.all([
    Notification.find(baseFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(baseFilter),
  ]);

  return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * getUnreadCountForUser — fast unread count (used for bell badge).
 */
export const getUnreadCountForUser = async (userId, userRole) => {
  const now = new Date();
  const roleFilter = [{ recipientRole: userRole }, { recipientRole: "all" }];

  return Notification.countDocuments({
    $or: [{ recipient: userId, isRead: false }, { isBroadcast: true, isRead: false, $or: roleFilter }],
    $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }],
  });
};
