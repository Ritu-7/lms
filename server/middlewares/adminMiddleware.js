import User from "../models/User.js";
import { getAuth } from "@clerk/express";

export const protectAdminRoutes = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please login again." });
    }

    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Admin auth error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};