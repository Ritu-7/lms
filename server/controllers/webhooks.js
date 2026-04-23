import { Webhook } from "svix";
import crypto from "crypto";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";

/* ===============================
    Clerk Webhook Logic
================================ */
export const clerkWebhook = async (req, res) => {
  try {
    const payloadString = req.body.toString("utf8");
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Verify headers
    const evt = wh.verify(payloadString, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { type, data } = evt;

    switch (type) {
      case 'user.created':
      case 'user.updated': {
        // Extracting required fields from Clerk data
        const { id, first_name, last_name, image_url, email_addresses, username } = data;
        
        const primaryEmail = email_addresses?.[0]?.email_address || "";
        
        // Multi-Level Name Logic
        const firstName = first_name || "";
        const lastName = last_name || "";
        let finalName = `${firstName} ${lastName}`.trim();

        if (!finalName) {
          finalName = username || primaryEmail.split('@')[0] || "User";
        }

        const userData = {
          clerkUserId: id,
          email: primaryEmail,
          name: finalName,
          imageUrl: image_url || "",
        };

        // Update or Create User in MongoDB
        await User.findOneAndUpdate(
          { clerkUserId: id },
          userData,
          { upsert: true, new: true }
        );
        
        console.log(`👤 User ${type}: ${id}`);
        break;
      }

      case 'user.deleted': {
        const { id } = data;
        await User.findOneAndDelete({ clerkUserId: id });
        console.log(`🗑️ User Deleted: ${id}`);
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ success: true, message: "Webhook received" });

  } catch (error) {
    console.error("❌ Clerk Webhook Error:", error.message);
    return res.status(400).json({ success: false, message: error.message });
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

        // Enroll user in the course
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