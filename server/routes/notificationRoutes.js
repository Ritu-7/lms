import express from "express";
import {
  getMyNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteNotification,
  broadcastNotification,
  sendToUsers,
  getNotificationAnalytics,
} from "../controllers/notificationController.js";
import { protectRoute } from "../middlewares/authMiddleware.js";
import { protectAdminRoutes } from "../middlewares/adminMiddleware.js";

const notificationRouter = express.Router();

/* ─── Authenticated user routes ───────────────────────────────────────────── */
notificationRouter.get("/", protectRoute, getMyNotifications);
notificationRouter.get("/unread-count", protectRoute, getUnreadCount);
notificationRouter.patch("/read-all", protectRoute, markAllRead);
notificationRouter.patch("/:id/read", protectRoute, markOneRead);
notificationRouter.delete("/:id", protectRoute, deleteNotification);

/* ─── Admin-only routes ───────────────────────────────────────────────────── */
notificationRouter.get("/analytics", protectAdminRoutes, getNotificationAnalytics);
notificationRouter.post("/broadcast", protectAdminRoutes, broadcastNotification);
notificationRouter.post("/send", protectAdminRoutes, sendToUsers);

export default notificationRouter;
