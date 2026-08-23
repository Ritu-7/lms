import fs from "fs";
import User from "../models/User.js";
import Course from "../models/Course.js";
import CourseProgress from "../models/CourseProgress.js";
import {
  findCertificateById,
  findCertificateByVerificationCode,
  issueCertificateForCourseCompletion,
  listCertificatesForUser,
  serializeCertificate,
  streamCertificatePdf,
} from "../services/certificateService.js";

export const getMyCertificates = async (req, res) => {
  try {
    const userId = req.clerkUserId;
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const certificates = await listCertificatesForUser(user._id);
    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;
    const certificate = await findCertificateByVerificationCode(verificationCode);
    if (!certificate) {
      return res.status(404).json({ success: false, valid: false, message: "Certificate not found" });
    }

    res.json({
      success: true,
      valid: certificate.status === "active",
      certificate: {
        ...serializeCertificate(certificate),
        studentName: certificate.user?.name || certificate.studentName,
        studentEmail: certificate.user?.email || certificate.studentEmail,
        courseTitle: certificate.course?.courseTitle || certificate.courseTitle,
        courseThumbnail: certificate.course?.courseThumbnail || "",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.clerkUserId;
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const certificate = await findCertificateById(certificateId);
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found" });

    const ownsCertificate = String(certificate.user?._id || certificate.user) === String(user._id);
    if (!ownsCertificate && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Certificate access denied" });
    }

    // Stream PDF on-the-fly — no disk needed
    await streamCertificatePdf(certificate, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * POST /api/certificates/generate
 * Manually trigger certificate issuance if course is 100% complete.
 */
export const generateCertificate = async (req, res) => {
  try {
    const userId = req.clerkUserId;
    const { courseId } = req.body;

    if (!courseId) return res.status(400).json({ success: false, message: "courseId is required" });

    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    // Fetch progress
    const progressDoc = await CourseProgress.findOne({ user: user._id, course: course._id });
    if (!progressDoc) {
      return res.status(400).json({ success: false, message: "No progress found for this course. Complete some lessons first." });
    }

    const totalLessons = progressDoc.totalLessons || 0;
    const completedCount = Array.isArray(progressDoc.completedLessons)
      ? progressDoc.completedLessons.length
      : (progressDoc.completedCount || 0);
    const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    if (completionPercentage < 100) {
      return res.status(400).json({
        success: false,
        message: `Course is only ${completionPercentage}% complete. Finish all lessons to earn your certificate.`,
        completionPercentage,
      });
    }

    const certificate = await issueCertificateForCourseCompletion({
      user,
      course,
      progressSummary: { totalLessons, completedCount, completionPercentage },
    });

    if (!certificate) {
      return res.status(400).json({ success: false, message: "Could not issue certificate. Ensure the course has lessons." });
    }

    res.json({
      success: true,
      message: "Certificate issued successfully!",
      certificate: serializeCertificate(certificate),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
