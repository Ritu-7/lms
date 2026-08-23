import crypto from "crypto";
import PDFDocument from "pdfkit";
import Certificate from "../models/Certificate.js";

const DEFAULT_CLIENT_URL = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0] || "http://localhost:5173";
const DEFAULT_BACKEND_URL = process.env.BACKEND_URL || process.env.SERVER_URL || "http://localhost:5000";

const buildCertificateId = (issuedAt = new Date()) => {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `CERT-${issuedAt.getFullYear()}-${suffix}`;
};

const buildVerificationCode = () => crypto.randomUUID().replace(/-/g, "").toUpperCase();
const buildVerificationUrl = (verificationCode) => `${DEFAULT_CLIENT_URL}/certificate/verify/${verificationCode}`;
const buildDownloadUrl = (certificateId) => `${DEFAULT_BACKEND_URL}/api/certificates/${certificateId}/download`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/**
 * Stream a beautiful certificate PDF directly to `res` (no disk writes).
 * Can also return a Buffer if `res` is omitted.
 */
export const streamCertificatePdf = (certificate, res = null) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });

    const W = 841.89; // A4 landscape width
    const H = 595.28; // A4 landscape height

    const chunks = [];

    if (res) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${certificate.certificateId}.pdf"`
      );
      doc.pipe(res);
    } else {
      doc.on("data", (chunk) => chunks.push(chunk));
    }

    doc.on("error", reject);

    // ── Background gradient-like fills ─────────────────────────────────────
    doc.rect(0, 0, W, H).fill("#0f172a"); // dark navy base
    doc.rect(0, 0, W, 12).fill("#2563eb"); // top blue bar
    doc.rect(0, H - 12, W, 12).fill("#2563eb"); // bottom blue bar
    doc.rect(0, 0, 12, H).fill("#2563eb"); // left blue bar
    doc.rect(W - 12, 0, 12, H).fill("#2563eb"); // right blue bar

    // Inner border frame
    doc.rect(24, 24, W - 48, H - 48).lineWidth(1.5).strokeColor("#334155").stroke();
    doc.rect(32, 32, W - 64, H - 64).lineWidth(0.5).strokeColor("#1e3a8a").stroke();

    // ── Decorative corner stars ─────────────────────────────────────────────
    const cornerR = 42;
    [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]].forEach(([cx, cy]) => {
      doc.circle(cx, cy, cornerR).lineWidth(1).strokeColor("#1e40af").stroke();
      doc.circle(cx, cy, cornerR - 8).lineWidth(0.5).strokeColor("#3b82f6").stroke();
    });

    // ── Header: Platform name ───────────────────────────────────────────────
    doc.fillColor("#60a5fa").fontSize(11).font("Helvetica-Bold")
      .text("LearnSphereAI  ·  Online Learning Platform", 0, 52, { align: "center", characterSpacing: 2 });

    // ── Main decorative line ────────────────────────────────────────────────
    doc.moveTo(80, 78).lineTo(W - 80, 78).lineWidth(0.5).strokeColor("#1e40af").stroke();

    // ── Title ───────────────────────────────────────────────────────────────
    doc.fillColor("#e2e8f0").fontSize(13).font("Helvetica")
      .text("CERTIFICATE OF COMPLETION", 0, 92, { align: "center", characterSpacing: 4 });

    // ── Recipient name ──────────────────────────────────────────────────────
    doc.fillColor("#f8fafc").fontSize(40).font("Helvetica-Bold")
      .text(certificate.studentName || "Learner", 0, 128, { align: "center" });

    // ── Sub-line ────────────────────────────────────────────────────────────
    doc.fillColor("#94a3b8").fontSize(13).font("Helvetica")
      .text("has successfully completed the course", 0, 182, { align: "center" });

    // ── Course title ─────────────────────────────────────────────────────────
    doc.fillColor("#38bdf8").fontSize(28).font("Helvetica-Bold")
      .text(certificate.courseTitle || "Course", 80, 210, { align: "center", width: W - 160 });

    // ── Divider ──────────────────────────────────────────────────────────────
    doc.moveTo(80, 272).lineTo(W - 80, 272).lineWidth(0.5).strokeColor("#1e40af").stroke();

    // ── Left column: Issued date + completion ──────────────────────────────
    const leftX = 90;
    const bottomY = 300;

    doc.fillColor("#64748b").fontSize(9).font("Helvetica-Bold").text("ISSUED ON", leftX, bottomY, { characterSpacing: 1 });
    doc.fillColor("#e2e8f0").fontSize(13).font("Helvetica-Bold").text(formatDate(certificate.issueDate), leftX, bottomY + 14);

    const snap = certificate.completionSnapshot || {};
    doc.fillColor("#64748b").fontSize(9).font("Helvetica-Bold").text("LESSONS COMPLETED", leftX, bottomY + 42, { characterSpacing: 1 });
    doc.fillColor("#e2e8f0").fontSize(13).font("Helvetica-Bold")
      .text(`${snap.completedCount || 0} / ${snap.totalLessons || 0}  (${snap.completionPercentage || 100}%)`, leftX, bottomY + 56);

    // ── Center column: Certificate ID + verification ───────────────────────
    const centerX = W / 2 - 90;
    doc.fillColor("#64748b").fontSize(9).font("Helvetica-Bold").text("CERTIFICATE ID", centerX, bottomY, { characterSpacing: 1 });
    doc.fillColor("#e2e8f0").fontSize(11).font("Helvetica-Bold").text(certificate.certificateId, centerX, bottomY + 14);

    doc.fillColor("#64748b").fontSize(9).font("Helvetica-Bold").text("VERIFICATION CODE", centerX, bottomY + 42, { characterSpacing: 1 });
    doc.fillColor("#60a5fa").fontSize(10).font("Helvetica").text(certificate.verificationCode, centerX, bottomY + 56, { width: 200 });

    // ── Right column: Signature block ─────────────────────────────────────
    const sigX = W - 220;
    // Decorative signature line
    doc.moveTo(sigX, bottomY + 30).lineTo(sigX + 140, bottomY + 30).lineWidth(1).strokeColor("#2563eb").stroke();
    doc.fillColor("#e2e8f0").fontSize(11).font("Helvetica-Bold").text("LearnSphereAI", sigX, bottomY + 36, { width: 140, align: "center" });
    doc.fillColor("#64748b").fontSize(9).font("Helvetica").text("Authorized Signature", sigX, bottomY + 50, { width: 140, align: "center", characterSpacing: 1 });

    // ── Footer verify URL ─────────────────────────────────────────────────
    doc.fillColor("#475569").fontSize(8.5).font("Helvetica")
      .text(`Verify at: ${certificate.verificationUrl || buildVerificationUrl(certificate.verificationCode)}`, 0, H - 40, { align: "center" });

    doc.end();

    if (res) {
      res.on("finish", resolve);
      res.on("error", reject);
    } else {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    }
  });
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
  verificationUrl: certificate.verificationUrl,
  course: certificate.course,
  user: certificate.user,
  downloadUrl: buildDownloadUrl(certificate.certificateId),
});

export const listCertificatesForUser = async (userId) => {
  const certificates = await Certificate.find({ user: userId })
    .populate("course", "courseTitle courseThumbnail")
    .sort({ issueDate: -1, createdAt: -1 })
    .lean();

  return certificates.map((certificate) => ({
    ...certificate,
    courseTitle: certificate.course?.courseTitle || certificate.courseTitle || "",
    courseThumbnail: certificate.course?.courseThumbnail || "",
    downloadUrl: buildDownloadUrl(certificate.certificateId),
    verificationUrl: certificate.verificationUrl || buildVerificationUrl(certificate.verificationCode),
  }));
};

export const findCertificateByVerificationCode = async (verificationCode) =>
  Certificate.findOne({ verificationCode })
    .populate("course", "courseTitle courseThumbnail")
    .populate("user", "name email imageUrl role")
    .lean();

export const findCertificateById = async (certificateId) =>
  Certificate.findOne({ certificateId })
    .populate("course", "courseTitle courseThumbnail")
    .populate("user", "name email imageUrl role")
    .lean();

export const issueCertificateForCourseCompletion = async ({ user, course, progressSummary }) => {
  if (!user || !course || !progressSummary) return null;
  if ((progressSummary.totalLessons || 0) === 0) return null;
  if (Number(progressSummary.completionPercentage || 0) < 100) return null;

  const existingCertificate = await Certificate.findOne({ user: user._id, course: course._id });
  if (existingCertificate) return existingCertificate;

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

  return certificate;
};
