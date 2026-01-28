import { Webhook } from "svix";
import crypto from "crypto";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";

/* ===============================
   Clerk Webhook
================================ */
export const clerkWebhook = async (req, res) => {
  try {
    const payload = req.body.toString("utf8");
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const event = wh.verify(payload, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { type, data } = event;

    const email =
      data.email_addresses?.find(
        (e) => e.id === data.primary_email_address_id
      )?.email_address || "";

    const name = `${data.first_name || ""} ${data.last_name || ""}`.trim();

    /* ========= USER CREATED / UPDATED ========= */
    if (type === "user.created" || type === "user.updated") {
      await User.findOneAndUpdate(
        { clerkUserId: data.id },          // ✅ MATCH BY CLERK ID
        {
          clerkUserId: data.id,            // ✅ STORE CLERK ID HERE
          name: name || "User",
          email,
          imageUrl: data.image_url || "",
          role: "student",
        },
        {
          upsert: true,
          new: true,
        }
      );

      console.log(`✅ User synced: ${data.id}`);
    }

    /* ========= USER DELETED ========= */
    if (type === "user.deleted") {
      await User.findOneAndDelete({ clerkUserId: data.id });
      console.log(`❌ User deleted: ${data.id}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Clerk Webhook Error:", error.message);
    return res.status(400).json({ success: false });
  }
};

/* ===============================
   Razorpay Webhook
================================ */
export const razorpayWebhook = async (req, res) => {
  try {
    const payload = req.body.toString("utf8");
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(payload);

    if (event.event === "order.paid") {
      const orderId = event.payload.order.entity.id;
      const paymentId = event.payload.payment.entity.id;

      const purchase = await Purchase.findOne({
        razorpayOrderId: orderId,
      });

      if (purchase && purchase.status !== "completed") {
        purchase.status = "completed";
        purchase.razorpayPaymentId = paymentId;
        await purchase.save();

        await User.findByIdAndUpdate(purchase.userId, {
          $addToSet: { enrolledCourses: purchase.courseId },
        });

        console.log(`✅ Payment completed: ${orderId}`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Razorpay Webhook Error:", error.message);
    return res.status(500).json({ success: false });
  }
};
