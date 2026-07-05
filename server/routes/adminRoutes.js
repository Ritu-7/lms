import express from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAdminOverviewData,
  updateAnnouncement,
} from "../controllers/platformController.js";
import { protectAdminRoutes } from "../middlewares/adminMiddleware.js";

const adminRouter = express.Router();

adminRouter.get("/overview", protectAdminRoutes, getAdminOverviewData);
adminRouter.post("/announcements", protectAdminRoutes, createAnnouncement);
adminRouter.put("/announcements/:id", protectAdminRoutes, updateAnnouncement);
adminRouter.delete("/announcements/:id", protectAdminRoutes, deleteAnnouncement);

export default adminRouter;