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
import { protectAdminRoutes } from "../middlewares/adminMiddleware.js";

const adminRouter = express.Router();

adminRouter.get("/overview", protectAdminRoutes, getAdminOverviewData);
adminRouter.get("/users", protectAdminRoutes, getAllUsers);
adminRouter.patch("/users/:id/role", protectAdminRoutes, updateUserRole);
adminRouter.patch("/users/:id/status", protectAdminRoutes, updateUserStatus);
adminRouter.delete("/users/:id", protectAdminRoutes, deleteUser);
adminRouter.post("/announcements", protectAdminRoutes, createAnnouncement);
adminRouter.put("/announcements/:id", protectAdminRoutes, updateAnnouncement);
adminRouter.delete("/announcements/:id", protectAdminRoutes, deleteAnnouncement);

export default adminRouter;