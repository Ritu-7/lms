import fs from "fs";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import Certificate from "../models/Certificate.js";

const CERTIFICATE_STORAGE_DIR = path.join(process.cwd(), "generated", "certificates");
const DEFAULT_CLIENT_URL = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0] || "http://localhost:5173";
const DEFAULT_BACKEND_URL = process.env.BACKEND_URL || process.env.SERVER_URL || "http://localhost:5000";

const ensureStorageDirectory = () => {
  fs.mkdirSync(CERTIFICATE_STORAGE_DIR, { recursive: true });
};

const buildCertificateId = (issuedAt = new Date()) => {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `CERT-${issuedAt.getFullYear()}-${suffix}`;
};

const buildVerificationCode = () => crypto.randomUUID().replace(/-/g, "").toUpperCase();
const buildVerificationUrl = (verificationCode) => `${DEFAULT_CLIENT_URL}/certificate/verify/${verificationCode}`;
const buildDownloadUrl = (certificateId) => `${DEFAULT_BACKEND_URL}/api/certificates/${certificateId}/download`;

const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const drawCertificatePdf = async (certificate) => {
  ensureStorageDirectory();

  const fileName = `${certificate.certificateId}.pdf`;
  const filePath = path.join(CERTIFICATE_STORAGE_DIR, fileName);
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const output = fs.createWriteStream(filePath);

  const finished = new Promise((resolve, reject) => {
    output.on("finish", resolve);
    output.on("error", reject);
  });

  doc.pipe(output);
  doc.rect(24, 24, 547, 794).lineWidth(2).strokeColor("#2563eb").stroke();
  doc.rect(38, 38, 519, 766).lineWidth(1).strokeColor("#dbeafe").stroke();

  doc.fillColor("#1d4ed8").fontSize(14).font("Helvetica-Bold").text("Certificate of Completion", { align: "center" });
  doc.moveDown(1.2);
  doc.fillColor("#111827").fontSize(30).font("Helvetica-Bold").text(certificate.studentName || "Learner", { align: "center" });
  doc.moveDown(0.4);
  doc.fontSize(14).font("Helvetica").fillColor("#374151").text("has successfully completed", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(24).font("Helvetica-Bold").fillColor("#111827").text(certificate.courseTitle || "Course", { align: "center" });
  doc.moveDown(0.6);
  doc.fontSize(12).font("Helvetica").fillColor("#4b5563").text(
    "This certificate confirms the learner completed all required lessons and met the course completion criteria.",
    { align: "center", width: 480, lineGap: 4 }
  );

  doc.moveDown(1.2);
  doc.fontSize(12).fillColor("#111827");
  doc.text(`Certificate ID: ${certificate.certificateId}`, 70, 305);
  doc.text(`Issued on: ${formatDate(certificate.issueDate)}`, 70, 330);
  doc.text(`Verification code: ${certificate.verificationCode}`, 70, 355);
  doc.text(`Verification URL: ${certificate.verificationUrl}`, 70, 380, { width: 300 });

  const qrX = 392;
  const qrY = 300;
  doc.roundedRect(qrX, qrY, 140, 140, 12).lineWidth(1.5).strokeColor("#93c5fd").stroke();
  doc.fillColor("#dbeafe").rect(qrX + 18, qrY + 18, 104, 104).fill();
  doc.fillColor("#1d4ed8").fontSize(18).font("Helvetica-Bold").text("QR", qrX, qrY + 58, { width: 140, align: "center" });
  doc.fillColor("#6b7280").fontSize(9).text("QR verification placeholder", qrX + 10, qrY + 152, { width: 120, align: "center" });

  doc.moveTo(70, 455).lineTo(510, 455).strokeColor("#d1d5db").stroke();
  doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold").text("Completion Snapshot", 70, 475);
  doc.font("Helvetica").fontSize(10).fillColor("#4b5563").text(`Lessons completed: ${certificate.completionSnapshot?.completedCount || 0} / ${certificate.completionSnapshot?.totalLessons || 0}`, 70, 495);
  doc.text(`Completion percentage: ${certificate.completionSnapshot?.completionPercentage || 0}%`, 70, 510);
  doc.text(`Completion source: ${certificate.completionSnapshot?.source || "progress-engine"}`, 70, 525);

  doc.fillColor("#111827").fontSize(12).font("Helvetica-Bold").text("Authorized by LMS Learning Platform", 70, 665);
  doc.font("Helvetica").fontSize(10).fillColor("#6b7280").text("This certificate can be verified online using the verification code above.", 70, 683, { width: 350 });

  doc.end();
  await finished;

  return { filePath, fileName };
};

export const serializeCertificate = (certificate) => ({
  _id: certificate._id,
  certificateId: certificate.certificateId,
  verificationCode: certificate.verificationCode,
  issueDate: certificate.issueDate,
  status: certificate.status,
  studentName: certificate.studentName,
  studentEmail: certificate.studentEmail,
  courseTitle: certificate.courseTitle,
  completionSnapshot: certificate.completionSnapshot || {},
  pdfPath: certificate.pdfPath,
  pdfFileName: certificate.pdfFileName,
  verificationUrl: certificate.verificationUrl,
  qrPlaceholder: certificate.qrPlaceholder,
  course: certificate.course,
  user: certificate.user,
  downloadUrl: buildDownloadUrl(certificate.certificateId),
});

export const listCertificatesForUser = async (userId) => {
  const certificates = await Certificate.find({ user: userId })
    .populate("course", "courseTitle")
    .sort({ issueDate: -1, createdAt: -1 })
    .lean();

  return certificates.map((certificate) => ({
    ...certificate,
    courseTitle: certificate.course?.courseTitle || certificate.courseTitle || "",
    downloadUrl: buildDownloadUrl(certificate.certificateId),
    verificationUrl: certificate.verificationUrl || buildVerificationUrl(certificate.verificationCode),
  }));
};

export const findCertificateByVerificationCode = async (verificationCode) =>
  Certificate.findOne({ verificationCode })
    .populate("course", "courseTitle")
    .populate("user", "name email imageUrl role")
    .lean();

export const findCertificateById = async (certificateId) =>
  Certificate.findOne({ certificateId })
    .populate("course", "courseTitle")
    .populate("user", "name email imageUrl role")
    .lean();

export const getCertificatePdfPath = (certificate) => certificate?.pdfPath || path.join(CERTIFICATE_STORAGE_DIR, `${certificate.certificateId}.pdf`);

export const issueCertificateForCourseCompletion = async ({ user, course, progressSummary }) => {
  if (!user || !course || !progressSummary) return null;
  if ((progressSummary.totalLessons || 0) === 0) return null;
  if (Number(progressSummary.completionPercentage || 0) < 100) return null;

  const existingCertificate = await Certificate.findOne({ user: user._id, course: course._id });
  if (existingCertificate) {
    if (!existingCertificate.pdfPath || !fs.existsSync(existingCertificate.pdfPath)) {
      const regenerated = await drawCertificatePdf({
        ...existingCertificate.toObject(),
        verificationUrl: existingCertificate.verificationUrl || buildVerificationUrl(existingCertificate.verificationCode),
      });
      existingCertificate.pdfPath = regenerated.filePath;
      existingCertificate.pdfFileName = regenerated.fileName;
      existingCertificate.verificationUrl = existingCertificate.verificationUrl || buildVerificationUrl(existingCertificate.verificationCode);
      await existingCertificate.save();
    }
    return existingCertificate;
  }

  const issueDate = new Date();
  const certificateId = buildCertificateId(issueDate);
  const verificationCode = buildVerificationCode();
  const verificationUrl = buildVerificationUrl(verificationCode);

  const certificate = await Certificate.create({
    certificateId,
    verificationCode,
    user: user._id,
    course: course._id,
    studentName: user.name || user.email || "Learner",
    studentEmail: user.email || "",
    courseTitle: course.courseTitle || "Course",
    issueDate,
    completionSnapshot: {
      totalLessons: Number(progressSummary.totalLessons || 0),
      completedCount: Number(progressSummary.completedCount || 0),
      completionPercentage: Number(progressSummary.completionPercentage || 0),
      completionByType: progressSummary.completionByType || {},
      completedLessons: progressSummary.completedLessons || [],
      source: "progress-engine",
    },
    verificationUrl,
  });

  const pdfInfo = await drawCertificatePdf(certificate);
  certificate.pdfPath = pdfInfo.filePath;
  certificate.pdfFileName = pdfInfo.fileName;
  await certificate.save();

  return certificate;
};
