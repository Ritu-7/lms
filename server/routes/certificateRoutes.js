import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  downloadCertificate,
  generateCertificate,
  getMyCertificates,
  verifyCertificate,
} from "../controllers/certificateController.js";

const certificateRouter = express.Router();

certificateRouter.get("/me", protectRoute, getMyCertificates);
certificateRouter.post("/generate", protectRoute, generateCertificate);
certificateRouter.get("/verify/:verificationCode", verifyCertificate);
certificateRouter.get("/:certificateId/download", protectRoute, downloadCertificate);

export default certificateRouter;
