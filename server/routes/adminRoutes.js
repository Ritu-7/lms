import express from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAdminOverviewData,
  updateAnnouncement,
} from "../controllers/platformController.js";
import {
  deleteUser,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from "../controllers/adminUserController.js";
import {
  getContactMessages,
  updateContactStatus,
  deleteContactMessage,
} from "../controllers/contactController.js";
import { adminCopilotChat } from "../controllers/aiController.js";
import { analyzeStudentRisk } from "../controllers/studentRiskController.js";
import { getEducatorInsights } from "../controllers/educatorInsightsController.js";
import { sendOutreach } from "../controllers/outreachController.js";
import { getCourseHealthScores, getCourseHealthDetail } from "../controllers/courseHealthController.js";
import { getAnalyticsInsights } from "../controllers/analyticsInsightsController.js";
import { getAnalyticsRecommendations } from "../controllers/analyticsRecommendationsController.js";
import { protectAdminRoutes } from "../middlewares/adminMiddleware.js";

const adminRouter = express.Router();

adminRouter.get("/overview", protectAdminRoutes, getAdminOverviewData);
adminRouter.get("/student-risk", protectAdminRoutes, analyzeStudentRisk);
adminRouter.get("/educator-insights/:educatorId", protectAdminRoutes, getEducatorInsights);
// Admin outreach (email + platform notifications to students/educators)
adminRouter.post("/send-outreach", protectAdminRoutes, sendOutreach);
adminRouter.get("/users", protectAdminRoutes, getAllUsers);
adminRouter.patch("/users/:id/role", protectAdminRoutes, updateUserRole);
adminRouter.patch("/users/:id/status", protectAdminRoutes, updateUserStatus);
adminRouter.delete("/users/:id", protectAdminRoutes, deleteUser);
adminRouter.post("/announcements", protectAdminRoutes, createAnnouncement);
adminRouter.put("/announcements/:id", protectAdminRoutes, updateAnnouncement);
adminRouter.delete("/announcements/:id", protectAdminRoutes, deleteAnnouncement);

// Contact Messages
adminRouter.get("/contact-messages", protectAdminRoutes, getContactMessages);
adminRouter.patch("/contact-messages/:id/status", protectAdminRoutes, updateContactStatus);
adminRouter.delete("/contact-messages/:id", protectAdminRoutes, deleteContactMessage);

// Course Health Scores
adminRouter.get("/course-health", protectAdminRoutes, getCourseHealthScores);
adminRouter.get("/course-health/:courseId", protectAdminRoutes, getCourseHealthDetail);

// Admin Copilot
adminRouter.get("/copilot", protectAdminRoutes, (req, res) => res.json({ success: true, message: "Copilot API is ready" }));
adminRouter.post("/copilot", protectAdminRoutes, adminCopilotChat);

// AI Analytics Insights
adminRouter.post("/analytics/ai-insights", protectAdminRoutes, getAnalyticsInsights);

// AI Platform Recommendations
adminRouter.get("/analytics/recommendations", protectAdminRoutes, getAnalyticsRecommendations);

export default adminRouter;