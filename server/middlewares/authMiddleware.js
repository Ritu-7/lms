import User from "../models/User.js";

/* ======================================
   Protect all authenticated routes
====================================== */
export const protectRoute = async (req, res, next) => {
  try {
    const auth = req.auth(); // ✅ ALWAYS a function

    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    req.clerkUserId = auth.userId; // store Clerk ID safely
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/* ======================================
   Protect educator-only routes
====================================== */
export const protectEducatorRoutes = async (req, res, next) => {
  try {
    const auth = req.auth(); // ✅ FIXED

    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
      });
    }

    const user = await User.findOne({
      clerkUserId: auth.userId, // ✅ correct lookup
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "educator") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Educator role required.",
      });
    }

    req.user = user; // MongoDB user (educator)
    next();
  } catch (error) {
    console.error("Educator auth error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
