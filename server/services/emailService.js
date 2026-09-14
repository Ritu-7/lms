/**
 * emailService.js
 *
 * Thin nodemailer wrapper for sending transactional emails via Gmail SMTP.
 *
 * Required .env variables:
 *   GMAIL_USER        — your Gmail address e.g. yourname@gmail.com
 *   GMAIL_APP_PASSWORD — Gmail App Password (NOT your main password)
 *                        Generate one at: Google Account → Security → 2-Step Verification → App passwords
 */

import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";

let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env"
    );
  }

  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return _transporter;
};

/**
 * sendEmail — sends a plain-text + HTML email.
 *
 * @param {Object} opts
 * @param {string} opts.to          recipient email address
 * @param {string} opts.subject     email subject
 * @param {string} opts.text        plain-text body
 * @param {string} [opts.html]      optional HTML body (falls back to wrapping text)
 * @param {string} [opts.fromLabel] display name for the "From" field
 * @returns {Promise<void>}
 */
export const sendEmail = async ({ to, subject, text, html, fromLabel = "LearnSphereAI" }) => {
  const transporter = getTransporter();
  const from = `"${fromLabel}" <${process.env.GMAIL_USER}>`;

  const htmlBody =
    html ||
    `<div style="font-family:sans-serif;max-width:640px;margin:auto;padding:24px">
      <h2 style="color:#1e40af;margin-bottom:16px">${subject}</h2>
      <div style="white-space:pre-wrap;line-height:1.6;color:#1e293b">${text}</div>
      <hr style="margin:32px 0;border-color:#e2e8f0"/>
      <p style="font-size:12px;color:#94a3b8">
        This message was sent by your LearnSphereAI platform administrator.
        If you believe you received this in error, please contact support.
      </p>
    </div>`;

  try {
    const info = await transporter.sendMail({ from, to, subject, text, html: htmlBody });
    logger.info("email.sent", { to, subject, messageId: info.messageId });
  } catch (error) {
    logger.error("email.send_failed", { to, subject, message: error.message });
    throw error;
  }
};

/**
 * isEmailConfigured — returns true if GMAIL_USER and GMAIL_APP_PASSWORD are set.
 * Use this to surface a helpful error on the frontend instead of a 500.
 */
export const isEmailConfigured = () =>
  Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
