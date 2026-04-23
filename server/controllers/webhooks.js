import { Webhook } from "svix";
import crypto from "crypto";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";

/* ===============================
   Clerk Webhook Logic
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

    // 1. Get Primary Email Safely
    const primaryEmail = data.email_addresses?.[0]?.email_address || "";

    // 2. Multi-Level Name Logic
    // Priority: First+Last Name > Username > Email Prefix > Default
    const firstName = data.first_name || "";
    const lastName = data.last_name || "";
    let finalName = `${firstName} ${lastName}`.trim();

    if (!finalName) {
      finalName = data.username || primaryEmail.split('@')[0] || "Student";
    }

    /* ========= USER CREATED / UPDATED ========= */
    if (type === "user.created" || type === "user.updated") {
      await User.findOneAndUpdate(
        { clerkUserId: data.id },
        {
          clerkUserId: data.id,
          name: finalName,
          email: primaryEmail,
          // Clerk sends image_url; we map to your DB field imageUrl
          imageUrl: data.image_url || data.profile_image_url || "",
          role: "student",
        },
        { 
          upsert: true, 
          new: true, 
          setDefaultsOnInsert: true 
        }
      );

      console.log(`✅ Sync Success: ${finalName} (${data.id})`);
    }

    /* ========= USER DELETED ========= */
    if (type === "user.deleted") {
      await User.findOneAndDelete({ clerkUserId: data.id });
      console.log(`❌ Deleted: ${data.id}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    return res.status(400).json({ success: false });
  }
};

/* ===============================
   Razorpay Webhook Logic
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
      return res.status(400).json({ success: false, message: "Signature Mismatch" });
    }

    const event = JSON.parse(payload);

    if (event.event === "order.paid") {
      const orderId = event.payload.order.entity.id;
      const paymentId = event.payload.payment.entity.id;

      const purchase = await Purchase.findOne({ razorpayOrderId: orderId });

      if (purchase && purchase.status !== "completed") {
        purchase.status = "completed";
        purchase.razorpayPaymentId = paymentId;
        await purchase.save();

        // Use purchase.userId (Clerk ID) to find the user and enroll them
        await User.findOneAndUpdate(
          { clerkUserId: purchase.userId }, 
          { $addToSet: { enrolledCourses: purchase.courseId } }
        );

        console.log(`✅ Enrollment Success for Order: ${orderId}`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Razorpay Error:", error.message);
    return res.status(500).json({ success: false });
  }
};