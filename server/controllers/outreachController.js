/**
 * outreachController.js
 *
 * POST /api/admin/send-outreach
 * Handles admin-initiated communications to students or educators.
 *
 * Supports:
 *   - "email"        — sends via Gmail SMTP (nodemailer)
 *   - "notification" — saves to MongoDB via notificationService
 *   - "both"         — both channels
 *
 * Includes deduplication: same admin → same recipient → same context
 * cannot be sent more than once within DEDUP_WINDOW_MS (default: 5 minutes).
 */

import User from "../models/User.js";
import OutreachLog from "../models/OutreachLog.js";
import { sendEmail, isEmailConfigured } from "../services/emailService.js";
import { createNotification } from "../services/notificationService.js";

// 5-minute dedup window — prevents double-clicks / accidental re-sends
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

export const sendOutreach = async (req, res, next) => {
  try {
    const adminUser = req.user;

    // ── 1. Parse and validate body ──────────────────────────────────────────
    const {
      recipientId,     // MongoDB User _id of the target student/educator
      subject,         // email subject / notification title
      message,         // the body text (admin-edited AI draft)
      channels,        // "email" | "notification" | "both"
      context = "admin_outreach",  // e.g. "student_risk" | "educator_insights"
    } = req.body;

    if (!recipientId || !subject?.trim() || !message?.trim() || !channels) {
      return res.status(400).json({
        success: false,
        message: "recipientId, subject, message, and channels are required.",
      });
    }

    const validChannels = ["email", "notification", "both"];
    if (!validChannels.includes(channels)) {
      return res.status(400).json({
        success: false,
        message: `channels must be one of: ${validChannels.join(", ")}`,
      });
    }

    // ── 2. Resolve recipient ────────────────────────────────────────────────
    const recipient = await User.findById(recipientId).lean();
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient user not found." });
    }

    if (!recipient.email) {
      return res.status(422).json({
        success: false,
        message: "Recipient has no email address on file.",
      });
    }

    // ── 3. Deduplication check ──────────────────────────────────────────────
    const dedupKey = `${adminUser._id}_${recipientId}_${context}`;
    const since = new Date(Date.now() - DEDUP_WINDOW_MS);

    const recentSend = await OutreachLog.findOne({
      dedupKey,
      createdAt: { $gte: since },
    }).lean();

    if (recentSend) {
      const secondsAgo = Math.round((Date.now() - new Date(recentSend.createdAt).getTime()) / 1000);
      return res.status(429).json({
        success: false,
        message: `A message was already sent to this recipient ${secondsAgo}s ago. Please wait before sending again.`,
        lastSentAt: recentSend.createdAt,
      });
    }

    // ── 4. Determine which channels to use ─────────────────────────────────
    const sendViaEmail = channels === "email" || channels === "both";
    const sendViaNotification = channels === "notification" || channels === "both";

    let emailStatus = "skipped";
    let notificationStatus = "skipped";
    const errors = [];

    // ── 5. Send email ───────────────────────────────────────────────────────
    if (sendViaEmail) {
      if (!isEmailConfigured()) {
        emailStatus = "failed";
        errors.push("Email service not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to server .env");
      } else {
        try {
          await sendEmail({
            to: recipient.email,
            subject,
            text: message,
            fromLabel: "LearnSphereAI Admin",
          });
          emailStatus = "sent";
        } catch (err) {
          emailStatus = "failed";
          errors.push(`Email failed: ${err.message}`);
        }
      }
    }

    // ── 6. Send platform notification ──────────────────────────────────────
    if (sendViaNotification) {
      try {
        await createNotification({
          recipient: recipient._id,
          sender: adminUser._id,
          senderLabel: "Admin",
          title: subject,
          message,
          type: "system",
          priority: "high",
          icon: context === "student_risk" ? "⚠️" : "📊",
          metadata: {
            refId: `outreach_${adminUser._id}_${recipientId}_${Date.now()}`,
            context,
            sentBy: adminUser._id.toString(),
          },
          skipDedup: true,  // Admin-sent messages always go through
        });
        notificationStatus = "sent";
      } catch (err) {
        notificationStatus = "failed";
        errors.push(`Platform notification failed: ${err.message}`);
      }
    }

    // ── 7. Log the outreach attempt ─────────────────────────────────────────
    await OutreachLog.create({
      recipientId: recipient._id,
      recipientEmail: recipient.email,
      sentBy: adminUser._id,
      subject,
      message,
      channels: channels === "both" ? ["email", "notification"] : [channels],
      emailStatus,
      notificationStatus,
      context,
      dedupKey,
    });

    // ── 8. Build response ───────────────────────────────────────────────────
    const allFailed =
      (sendViaEmail && emailStatus === "failed") &&
      (sendViaNotification && notificationStatus === "failed");

    if (allFailed) {
      return res.status(502).json({
        success: false,
        message: "All channels failed to deliver the message.",
        details: { emailStatus, notificationStatus, errors },
      });
    }

    res.json({
      success: true,
      message: "Outreach sent successfully.",
      details: {
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        emailStatus,
        notificationStatus,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};
