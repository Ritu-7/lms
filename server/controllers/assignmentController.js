import fs from "fs";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import { normalizeResourceType } from "../services/resourceService.js";
import { notifyAssignmentCreated, notifyAssignmentGraded, notifyNewSubmissionToEducator } from "../services/notificationService.js";
import {
  canResubmitAssignment,
  computeAttemptSnapshot,
  normalizeAssignmentAttachments,
  normalizeAssignmentRubric,
  summarizeAssignmentSubmission,
} from "../services/assignmentService.js";

const buildAttachmentMetadata = (file, uploaded) => {
  const resourceType = normalizeResourceType({
    resourceType: uploaded.resource_type || file?.mimetype || "",
    resourceMimeType: file?.mimetype || "",
    resourceFileName: file?.originalname || "",
    resourceUrl: uploaded.secure_url || "",
  });

  return {
    resourceId: randomUUID(),
    resourceTitle: file?.originalname || "Untitled file",
    resourceType,
    resourceUrl: uploaded.secure_url,
    resourceFileName: file?.originalname || "",
    resourceMimeType: file?.mimetype || "",
    resourceSize: file?.size || 0,
    resourceDuration: Number(uploaded.duration || 0),
    resourceThumbnail: uploaded.thumbnail_url || (resourceType === "image" ? uploaded.secure_url : "") || "",
    resourceTranscriptPlaceholder: "",
    resourceUploadDate: new Date().toISOString(),
    resourceOrder: 1,
    resourcePublicId: uploaded.public_id,
    resourceStorageType: uploaded.resource_type || "auto",
  };
};

const uploadFiles = async (files = [], folder = "lms/assignments") => {
  const safeFiles = Array.isArray(files) ? files.filter(Boolean) : [];
  const uploadedFiles = [];

  for (const file of safeFiles) {
    const uploaded = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      folder,
    });
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    uploadedFiles.push(buildAttachmentMetadata(file, uploaded));
  }

  return uploadedFiles;
};

const parsePayload = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const assertCourseOwnership = async (educatorId, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) return { course: null, error: "Course not found" };
  if (course.educator.toString() !== educatorId.toString()) return { course: null, error: "Not authorized" };
  return { course, error: null };
};

const getEducatorContext = async (req) => {
  const { userId } = req.auth();
  const educator = await User.findOne({ clerkUserId: userId });
  return { userId, educator };
};

export const uploadAssignmentAssets = async (req, res) => {
  try {
    const files = req.files || [];
    const assets = await uploadFiles(files, "lms/assignment-assets");
    res.json({ success: true, assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const { educator } = await getEducatorContext(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const assignmentData = parsePayload(req.body.assignmentData, req.body);
    const { course, error } = await assertCourseOwnership(educator._id, assignmentData.course);
    if (error) return res.status(403).json({ success: false, message: error });

    const attachments = await uploadFiles(req.files || [], "lms/assignment-assets");
    const assignment = await Assignment.create({
      title: assignmentData.title,
      description: assignmentData.description || "",
      instructions: assignmentData.instructions || "",
      course: course._id,
      module: assignmentData.module || null,
      lesson: assignmentData.lesson || null,
      educator: educator._id,
      status: assignmentData.status || "draft",
      dueDate: assignmentData.dueDate,
      allowLateSubmissions: assignmentData.allowLateSubmissions ?? true,
      latePenaltyPercent: Number(assignmentData.latePenaltyPercent || 0),
      maxAttempts: Number(assignmentData.maxAttempts || 3),
      totalPoints: Number(assignmentData.totalPoints || 100),
      rubric: normalizeAssignmentRubric(assignmentData.rubric),
      attachments: normalizeAssignmentAttachments([...(assignmentData.attachments || []), ...attachments]),
      tags: Array.isArray(assignmentData.tags) ? assignmentData.tags : String(assignmentData.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    });

    // ── Notification: assignment created ──────────────────────────────
    if ((assignmentData.status || "draft") === "published") {
      const enrolledIds = (course.studentsEnrolled || []).map((id) => id.toString());
      notifyAssignmentCreated(enrolledIds, course._id, assignment._id, assignment.title);
    }

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listEducatorAssignments = async (req, res) => {
  try {
    const { educator } = await getEducatorContext(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const assignments = await Assignment.find({ educator: educator._id })
      .populate("course", "courseTitle courseThumbnail")
      .sort({ createdAt: -1 })
      .lean();

    const assignmentIds = assignments.map((assignment) => assignment._id);
    const submissions = await AssignmentSubmission.find({ assignment: { $in: assignmentIds } }).lean();
    const submissionMap = new Map();

    for (const submission of submissions) {
      const key = submission.assignment.toString();
      const bucket = submissionMap.get(key) || { submitted: 0, graded: 0, late: 0, needsResubmission: 0 };
      bucket.submitted += submission.status !== "not_submitted" ? 1 : 0;
      bucket.graded += submission.status === "graded" ? 1 : 0;
      bucket.late += submission.isLate ? 1 : 0;
      bucket.needsResubmission += submission.status === "needs_resubmission" ? 1 : 0;
      submissionMap.set(key, bucket);
    }

    res.json({
      success: true,
      assignments: assignments.map((assignment) => ({
        ...assignment,
        submissionSummary: submissionMap.get(assignment._id.toString()) || { submitted: 0, graded: 0, late: 0, needsResubmission: 0 },
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { educator } = await getEducatorContext(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    if (assignment.educator.toString() !== educator._id.toString()) return res.status(403).json({ success: false, message: "Not authorized" });

    const assignmentData = parsePayload(req.body.assignmentData, req.body);
    const attachments = req.files?.length ? await uploadFiles(req.files, "lms/assignment-assets") : [];
    const updates = {
      ...assignmentData,
      rubric: assignmentData.rubric ? normalizeAssignmentRubric(assignmentData.rubric) : assignment.rubric,
    };
    if (attachments.length) {
      updates.attachments = normalizeAssignmentAttachments([...(assignment.attachments || []), ...attachments]);
    }

    if (updates.tags && !Array.isArray(updates.tags)) {
      updates.tags = String(updates.tags).split(",").map((tag) => tag.trim()).filter(Boolean);
    }

    Object.assign(assignment, updates);
    await assignment.save();

    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const { educator } = await getEducatorContext(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    if (assignment.educator.toString() !== educator._id.toString()) return res.status(403).json({ success: false, message: "Not authorized" });

    await AssignmentSubmission.deleteMany({ assignment: assignment._id });
    await assignment.deleteOne();
    res.json({ success: true, message: "Assignment deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentAssignments = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const assignments = await Assignment.find({ course: { $in: user.enrolledCourses }, status: "published" })
      .populate("course", "courseTitle courseThumbnail")
      .sort({ dueDate: 1 })
      .lean();

    const assignmentIds = assignments.map((assignment) => assignment._id);
    const submissions = await AssignmentSubmission.find({ student: user._id, assignment: { $in: assignmentIds } }).lean();
    const submissionMap = new Map(submissions.map((submission) => [submission.assignment.toString(), submission]));

    res.json({
      success: true,
      assignments: assignments.map((assignment) => ({
        ...assignment,
        submission: summarizeAssignmentSubmission(submissionMap.get(assignment._id.toString())),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignmentDetails = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const assignment = await Assignment.findById(req.params.assignmentId)
      .populate("course", "courseTitle courseThumbnail")
      .populate("educator", "name imageUrl email")
      .lean();
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

    const isOwner = assignment.educator?._id?.toString?.() === user._id.toString();
    const isEnrolled = user.enrolledCourses.some((courseId) => courseId.toString() === assignment.course?._id?.toString?.());
    if (!isOwner && !isEnrolled && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Enrollment required" });
    }

    const submission = await AssignmentSubmission.findOne({ assignment: assignment._id, student: user._id }).lean();
    res.json({ success: true, assignment: { ...assignment, submission: summarizeAssignmentSubmission(submission) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const student = await User.findOne({ clerkUserId: userId });
    if (!student) return res.status(404).json({ success: false, message: "User not found" });

    const assignment = await Assignment.findById(req.params.assignmentId).populate("course", "courseTitle");
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    if (assignment.status !== "published") return res.status(409).json({ success: false, message: "Assignment is not open for submissions" });
    if (!student.enrolledCourses.some((courseId) => courseId.toString() === assignment.course._id.toString())) {
      return res.status(403).json({ success: false, message: "Enrollment required" });
    }

    const existingSubmission = await AssignmentSubmission.findOne({ assignment: assignment._id, student: student._id });
    if (existingSubmission && !canResubmitAssignment(assignment, existingSubmission)) {
      return res.status(409).json({ success: false, message: "Resubmissions are not allowed or attempt limit reached" });
    }

    const payload = parsePayload(req.body.submissionData, req.body);
    const attachments = await uploadFiles(req.files || [], "lms/assignment-submissions");
    const nextAttemptNumber = (existingSubmission?.attemptCount || 0) + 1;
    const snapshot = computeAttemptSnapshot({
      attemptNumber: nextAttemptNumber,
      submittedAt: new Date(),
      textResponse: payload.textResponse || "",
      attachments,
      rubricScores: normalizeAssignmentRubric(payload.rubricScores || payload.rubric || []).map((score) => ({
        rubricId: score.rubricId,
        title: score.title,
        maxScore: Number(score.maxScore || 0),
        score: Number(score.score || 0),
        feedback: score.feedback || "",
      })),
      assignment,
    });

    const nextStatus = snapshot.status === "late_submitted" && !assignment.allowLateSubmissions
      ? "not_submitted"
      : snapshot.status;

    const updated = await AssignmentSubmission.findOneAndUpdate(
      { assignment: assignment._id, student: student._id },
      {
        assignment: assignment._id,
        course: assignment.course,
        student: student._id,
        educator: assignment.educator,
        status: nextStatus,
        attemptCount: nextAttemptNumber,
        submittedAt: snapshot.submittedAt,
        isLate: snapshot.isLate,
        totalScore: snapshot.totalScore,
        maxScore: snapshot.maxScore,
        gradeLabel: snapshot.gradeLabel,
        feedback: snapshot.feedback,
        textResponse: snapshot.textResponse,
        attachments: snapshot.attachments,
        rubricScores: snapshot.rubricScores,
        latestAttempt: snapshot,
        $push: { attempts: snapshot },
        resubmissionRequestedAt: null,
        returnedAt: null,
        latePenaltyApplied: snapshot.latePenaltyApplied,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Assignment.findByIdAndUpdate(assignment._id, {
      $inc: { submissionCount: 1 },
    });

    res.json({ success: true, submission: summarizeAssignmentSubmission(updated) });

    // ── Notification: new submission to educator ────────────────────
    notifyNewSubmissionToEducator(assignment.educator, student.name || "A student", assignment._id, assignment.title);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewAssignmentSubmission = async (req, res) => {
  try {
    const { educator } = await getEducatorContext(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const submission = await AssignmentSubmission.findById(req.params.submissionId).populate("assignment");
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });

    if (submission.educator.toString() !== educator._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const reviewData = parsePayload(req.body.reviewData, req.body);
    const rubricScores = normalizeAssignmentRubric(reviewData.rubricScores || submission.rubricScores).map((score) => ({
      rubricId: score.rubricId,
      title: score.title,
      maxScore: Number(score.maxScore || 0),
      score: Number(score.score || 0),
      feedback: score.feedback || "",
    }));
    const totals = rubricScores.reduce((sum, item) => sum + Number(item.score || 0), 0);
    const maxScore = rubricScores.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
    const needsResubmission = Boolean(reviewData.needsResubmission);
    const finalStatus = needsResubmission ? "needs_resubmission" : "graded";

    submission.status = finalStatus;
    submission.totalScore = Number(reviewData.totalScore ?? totals);
    submission.maxScore = Number(reviewData.maxScore ?? maxScore);
    submission.gradeLabel = reviewData.gradeLabel || submission.gradeLabel || "";
    submission.feedback = reviewData.feedback || "";
    submission.rubricScores = rubricScores;
    submission.reviewedBy = educator._id;
    submission.reviewedAt = new Date();
    submission.gradedAt = needsResubmission ? null : new Date();
    submission.returnedAt = needsResubmission ? new Date() : null;
    submission.resubmissionRequestedAt = needsResubmission ? new Date() : null;
    submission.latestAttempt = {
      ...submission.latestAttempt?.toObject?.(),
      status: finalStatus,
      totalScore: submission.totalScore,
      maxScore: submission.maxScore,
      gradeLabel: submission.gradeLabel,
      feedback: submission.feedback,
      rubricScores,
      reviewedAt: submission.reviewedAt,
      reviewedBy: submission.reviewedBy,
    };
    await submission.save();

    // ── Notification: assignment graded ────────────────────────────
    const assignmentTitle = submission.assignment?.title || "an assignment";
    const grade = `${submission.totalScore}/${submission.maxScore}`;
    notifyAssignmentGraded(submission.student, submission.assignment._id || req.params.submissionId, assignmentTitle, grade);

    await Assignment.findByIdAndUpdate(submission.assignment._id, {
      $inc: { gradedCount: needsResubmission ? 0 : 1 },
    });

    res.json({ success: true, submission: summarizeAssignmentSubmission(submission) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { educator } = await getEducatorContext(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    if (assignment.educator.toString() !== educator._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignment._id })
      .populate("student", "name email imageUrl")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      submissions: submissions.map((submission) => ({
        ...submission,
        summary: summarizeAssignmentSubmission(submission),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
