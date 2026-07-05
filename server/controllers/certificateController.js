import fs from "fs";
import User from "../models/User.js";
import { findCertificateById, findCertificateByVerificationCode, getCertificatePdfPath, listCertificatesForUser, serializeCertificate } from "../services/certificateService.js";

export const getMyCertificates = async (req, res) => {
  try {
    const { userId } = req.auth();
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
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { userId } = req.auth();
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const certificate = await findCertificateById(certificateId);
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found" });

    const ownsCertificate = String(certificate.user?._id || certificate.user) === String(user._id);
    if (!ownsCertificate && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Certificate access denied" });
    }

    const pdfPath = getCertificatePdfPath(certificate);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ success: false, message: "Certificate PDF is unavailable" });
    }

    res.download(pdfPath, certificate.pdfFileName || `${certificate.certificateId}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
