import { Webhook } from "svix";
import crypto from "node:crypto";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import { resolveUserRole } from "../utils/roleUtils.js";
import { logger } from "../utils/logger.js";

export const clerkWebhook = async (req, res) => {
  try {
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const event = webhook.verify(req.body.toString("utf8"), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });
    const { type, data } = event;
    const email = data.email_addresses?.find((item) => item.id === data.primary_email_address_id)?.email_address || "";
    const name = `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User";

    if (type === "user.created" || type === "user.updated") {
      const existing = await User.findOne({ clerkUserId: data.id });
      await User.findOneAndUpdate(
        { clerkUserId: data.id },
        { clerkUserId: data.id, name, email, imageUrl: data.image_url || "", role: resolveUserRole({ clerkUserId: data.id, email, existingRole: existing?.role }) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      logger.info("webhook.clerk_user_synced", { clerkUserId: data.id });
    } else if (type === "user.deleted") {
      await User.findOneAndDelete({ clerkUserId: data.id });
      logger.info("webhook.clerk_user_deleted", { clerkUserId: data.id });
    }
    res.json({ success: true });
  } catch (error) {
    logger.warn("webhook.clerk_rejected", { message: error.message });
    res.status(400).json({ success: false, message: "Invalid webhook" });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"] || "";
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(req.body).digest("hex");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    if (event.event === "order.paid") {
      const orderId = event.payload.order.entity.id;
      const paymentId = event.payload.payment.entity.id;
      const purchase = await Purchase.findOneAndUpdate(
        { razorpayOrderId: orderId },
        { status: "completed", razorpayPaymentId: paymentId },
        { new: true }
      );
      if (purchase) {
        await Promise.all([
          User.findByIdAndUpdate(purchase.user, { $addToSet: { enrolledCourses: purchase.course } }),
          Course.findByIdAndUpdate(purchase.course, { $addToSet: { studentsEnrolled: purchase.user } }),
        ]);
        logger.info("webhook.razorpay_payment_completed", { orderId });
      }
    }
    res.json({ success: true });
  } catch (error) {
    logger.error("webhook.razorpay_failed", { message: error.message });
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};
