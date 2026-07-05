import express from "express";
import { getAnnouncements, getPlatformHome } from "../controllers/platformController.js";

const platformRouter = express.Router();

platformRouter.get("/home", getPlatformHome);
platformRouter.get("/announcements", getAnnouncements);

export default platformRouter;