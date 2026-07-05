import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import {
  createNotification,
  getNotificationsForUser,
  getUnreadCountForUser,
} from "../services/notificationService.js";
import { AppError } from "../utils/AppError.js";

// ── Helper: resolve the caller's MongoDB user ─────────────────────────────────
const resolveUser = async (clerkUserId) => {
  const user = await User.findOne({ clerkUserId }).lean();
  if (!user) throw new AppError(404, "User not found");
  return user;
};

// ── Helper: build the filter that matches notifications "visible" to a user ───
const buildVisibilityFilter = (userId, userRole, extraFilter = {}) => {
  const now = new Date();
  return {
    $or: [
      { recipient: userId },
      { isBroadcast: true, $or: [{ recipientRole: userRole }, { recipientRole: "all" }] },
    ],
    $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }],
    ...extraFilter,
  };
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/notifications
   Query: page, limit, type, unread (boolean string)
─────────────────────────────────────────────────────────────────────────────── */
export const getMyNotifications = async (req, res, next) => {
  try {
    const user = await resolveUser(req.clerkUserId);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const type = req.query.type || null;
    const unreadOnly = req.query.unread === "true";

    const result = await getNotificationsForUser(user._id, user.role, {
      page,
      limit,
      type,
      unreadOnly,
    });

    const unreadCount = await getUnreadCountForUser(user._id, user.role);

    res.json({
      success: true,
      ...result,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/notifications/unread-count
   Fast endpoint for the bell badge — only returns unreadCount.
─────────────────────────────────────────────────────────────────────────────── */
export const getUnreadCount = async (req, res, next) => {
  try {
    const user = await resolveUser(req.clerkUserId);
    const unreadCount = await getUnreadCountForUser(user._id, user.role);
    res.json({ success: true, unreadCount });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /api/notifications/:id/read
─────────────────────────────────────────────────────────────────────────────── */
export const markOneRead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return next(new AppError(400, "Invalid notification id"));
    }

    const user = await resolveUser(req.clerkUserId);
    const filter = buildVisibilityFilter(user._id, user.role, {
      _id: req.params.id,
    });

    const notification = await Notification.findOneAndUpdate(
      filter,
      { isRead: true, readAt: new Date() },
      { new: true }
    ).lean();

    if (!notification) return next(new AppError(404, "Notification not found"));

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /api/notifications/read-all
─────────────────────────────────────────────────────────────────────────────── */
export const markAllRead = async (req, res, next) => {
  try {
    const user = await resolveUser(req.clerkUserId);

    const filter = buildVisibilityFilter(user._id, user.role, { isRead: false });

    const result = await Notification.updateMany(filter, {
      isRead: true,
      readAt: new Date(),
    });

    res.json({ success: true, updatedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE /api/notifications/:id
─────────────────────────────────────────────────────────────────────────────── */
export const deleteNotification = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return next(new AppError(400, "Invalid notification id"));
    }

    const user = await resolveUser(req.clerkUserId);
    const filter = buildVisibilityFilter(user._id, user.role, {
      _id: req.params.id,
    });

    const notification = await Notification.findOneAndDelete(filter);
    if (!notification) return next(new AppError(404, "Notification not found"));

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/notifications/broadcast   (Admin only)
   Body: { title, message, type, priority, recipientRole, actionUrl, expiresAt }
─────────────────────────────────────────────────────────────────────────────── */
export const broadcastNotification = async (req, res, next) => {
  try {
    const {
      title,
      message,
      type = "announcement",
      priority = "medium",
      recipientRole = "all",
      actionUrl = null,
      expiresAt = null,
    } = req.body;

    if (!title || !message) {
      return next(new AppError(400, "Title and message are required"));
    }

    const validRoles = ["student", "educator", "admin", "all"];
    if (!validRoles.includes(recipientRole)) {
      return next(new AppError(400, `recipientRole must be one of: ${validRoles.join(", ")}`));
    }

    const notification = await createNotification({
      isBroadcast: true,
      recipientRole,
      sender: req.user._id,
      senderLabel: req.user.name || "Admin",
      title,
      message,
      type,
      priority,
      actionUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      skipDedup: true,
    });

    res.status(201).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/notifications/send   (Admin only)
   Body: { userIds[], title, message, type, priority, actionUrl }
─────────────────────────────────────────────────────────────────────────────── */
export const sendToUsers = async (req, res, next) => {
  try {
    const {
      userIds = [],
      title,
      message,
      type = "system",
      priority = "medium",
      actionUrl = null,
    } = req.body;

    if (!title || !message) {
      return next(new AppError(400, "Title and message are required"));
    }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return next(new AppError(400, "userIds array is required and must not be empty"));
    }

    const validIds = userIds.filter((id) => mongoose.isValidObjectId(id));
    if (validIds.length === 0) {
      return next(new AppError(400, "No valid user IDs provided"));
    }

    const docs = validIds.map((uid) => ({
      recipient: uid,
      sender: req.user._id,
      senderLabel: req.user.name || "Admin",
      title,
      message,
      type,
      priority,
      actionUrl,
      icon: null,
      metadata: { sentByAdmin: true },
      isRead: false,
    }));

    const inserted = await Notification.insertMany(docs, { ordered: false });

    res.status(201).json({ success: true, count: inserted.length });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/notifications/analytics   (Admin only)
─────────────────────────────────────────────────────────────────────────────── */
export const getNotificationAnalytics = async (req, res, next) => {
  try {
    const [byType, byPriority, recent] = await Promise.all([
      Notification.aggregate([
        { $group: { _id: "$type", total: { $sum: 1 }, unread: { $sum: { $cond: ["$isRead", 0, 1] } } } },
        { $sort: { total: -1 } },
      ]),
      Notification.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Notification.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
    ]);

    const totalCount = await Notification.countDocuments();
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      analytics: {
        totalCount,
        unreadCount,
        byType,
        byPriority,
        recent,
      },
    });
  } catch (error) {
    next(error);
  }
};
