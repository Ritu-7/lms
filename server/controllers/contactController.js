import crypto from "node:crypto";
import ContactMessage from "../models/ContactMessage.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SUBJECTS = [
  "General Enquiry",
  "Technical Support",
  "Billing & Payments",
  "Course Content Feedback",
  "Educator Partnership",
  "Enterprise / Institutional Plans",
  "Press & Media",
  "Other",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Build a SHA-256 fingerprint from IP + User-Agent so we can catch rapid duplicates. */
function buildFingerprint(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  const ua = req.headers["user-agent"] || "unknown";
  return crypto.createHash("sha256").update(`${ip}::${ua}`).digest("hex");
}

// ─── Public: Submit Contact Form ──────────────────────────────────────────────

/**
 * POST /api/contact
 * Public – no authentication required.
 */
export const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // ── Server-side validation ──────────────────────────────────────────────
    const errors = {};
    if (!name?.trim()) errors.name = "Please enter your full name.";
    else if (name.trim().length > 120) errors.name = "Name must be 120 characters or fewer.";

    if (!email?.trim()) errors.email = "Please enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) errors.email = "Please enter a valid email address.";

    if (!subject) errors.subject = "Please select a subject.";
    else if (!SUBJECTS.includes(subject)) errors.subject = "Invalid subject selected.";

    if (!message?.trim()) errors.message = "Please enter your message.";
    else if (message.trim().length < 20) errors.message = "Message must be at least 20 characters.";
    else if (message.trim().length > 2000) errors.message = "Message must be 2000 characters or fewer.";

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        success: false,
        message: "Validation failed. Please check the form fields.",
        errors,
      });
    }

    // ── Duplicate detection (same fingerprint + email + subject within 10 min) ─
    const ipFingerprint = buildFingerprint(req);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const duplicate = await ContactMessage.findOne({
      ipFingerprint,
      email: email.trim().toLowerCase(),
      subject,
      createdAt: { $gte: tenMinutesAgo },
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "It looks like you already sent this message recently. Please wait 10 minutes before submitting again.",
      });
    }

    // ── Persist ─────────────────────────────────────────────────────────────
    await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject,
      message: message.trim(),
      ipFingerprint,
    });

    return res.status(201).json({
      success: true,
      message:
        "Thank you for reaching out! We'll get back to you within 24 business hours.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: List Contact Messages ─────────────────────────────────────────────

/**
 * GET /api/admin/contact-messages
 * Query params: page, limit, status, subject, search
 */
export const getContactMessages = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    if (req.query.subject && req.query.subject !== "all") {
      filter.subject = req.query.subject;
    }

    if (req.query.search?.trim()) {
      const q = req.query.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      ContactMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Update Status ─────────────────────────────────────────────────────

/**
 * PATCH /api/admin/contact-messages/:id/status
 * Body: { status: 'read' | 'replied' | 'new' }
 */
export const updateContactStatus = async (req, res, next) => {
  try {
    const ALLOWED = ["new", "read", "replied"];
    const { status } = req.body;

    if (!ALLOWED.includes(status)) {
      return res.status(422).json({
        success: false,
        message: `Invalid status. Must be one of: ${ALLOWED.join(", ")}`,
      });
    }

    const doc = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    return res.json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Delete ────────────────────────────────────────────────────────────

/**
 * DELETE /api/admin/contact-messages/:id
 */
export const deleteContactMessage = async (req, res, next) => {
  try {
    const doc = await ContactMessage.findByIdAndDelete(req.params.id).lean();

    if (!doc) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    return res.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    next(error);
  }
};
