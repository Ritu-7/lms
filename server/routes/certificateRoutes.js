import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import { downloadCertificate, getMyCertificates, verifyCertificate } from "../controllers/certificateController.js";

const certificateRouter = express.Router();

certificateRouter.get("/me", protectRoute, getMyCertificates);
certificateRouter.get("/verify/:verificationCode", verifyCertificate);
certificateRouter.get("/:certificateId/download", protectRoute, downloadCertificate);

export default certificateRouter;
