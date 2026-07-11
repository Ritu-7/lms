import mongoose from "mongoose";
import Course from "../models/Course.js";
import User from "../models/User.js";

const validRoles = ["student", "educator", "admin"];
const validStatuses = ["active", "suspended"];

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sendError = (res, status, message) => res.status(status).json({ success: false, message });

const serializeUser = (user, courseCountMap = new Map()) => ({
  _id: user._id,
  clerkUserId: user.clerkUserId,
  name: user.name,
  email: user.email,
  imageUrl: user.imageUrl || "",
  role: user.role || "student",
  status: user.status || "active",
  enrolledCourses: user.enrolledCourses || [],
  courseCount: user.role === "educator" ? Number(courseCountMap.get(user._id.toString()) || 0) : (user.enrolledCourses || []).length,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getTargetUser = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return User.findById(id);
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};

    if (role && !validRoles.includes(role)) {
      return sendError(res, 400, `role must be one of: ${validRoles.join(", ")}`);
    }

    if (status && !validStatuses.includes(status)) {
      return sendError(res, 400, `status must be one of: ${validStatuses.join(", ")}`);
    }

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    if (search && String(search).trim()) {
      const searchTerm = escapeRegex(String(search).trim());
      filter.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { clerkUserId: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const [users, educatorCourseCounts] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).lean(),
      Course.aggregate([
        { $group: { _id: "$educator", count: { $sum: 1 } } },
      ]),
    ]);

    const courseCountMap = new Map(
      educatorCourseCounts
        .filter((entry) => entry._id)
        .map((entry) => [entry._id.toString(), entry.count])
    );

    res.json({
      success: true,
      users: users.map((user) => serializeUser(user, courseCountMap)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, confirmAdminPromotion } = req.body || {};

    if (!validRoles.includes(role)) {
      return sendError(res, 400, `role must be one of: ${validRoles.join(", ")}`);
    }

    const targetUser = await getTargetUser(id);
    if (!targetUser) {
      return sendError(res, 404, "User not found");
    }

    if (targetUser.clerkUserId === req.user.clerkUserId) {
      return sendError(res, 403, "You cannot change your own role");
    }

    if (role === "admin" && confirmAdminPromotion !== true) {
      return sendError(res, 400, "Admin promotion requires explicit confirmation");
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({ success: true, user: serializeUser(targetUser) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!validStatuses.includes(status)) {
      return sendError(res, 400, `status must be one of: ${validStatuses.join(", ")}`);
    }

    const targetUser = await getTargetUser(id);
    if (!targetUser) {
      return sendError(res, 404, "User not found");
    }

    if (targetUser.clerkUserId === req.user.clerkUserId) {
      return sendError(res, 403, "You cannot change your own status");
    }

    targetUser.status = status;
    await targetUser.save();

    res.json({ success: true, user: serializeUser(targetUser) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await getTargetUser(id);

    if (!targetUser) {
      return sendError(res, 404, "User not found");
    }

    if (targetUser.clerkUserId === req.user.clerkUserId) {
      return sendError(res, 403, "You cannot delete your own account");
    }

    const authoredCourseCount = await Course.countDocuments({ educator: targetUser._id });
    if (authoredCourseCount > 0) {
      return sendError(res, 409, "This educator owns courses. Reassign or remove those courses before deleting the user.");
    }

    await Course.updateMany({ studentsEnrolled: targetUser._id }, { $pull: { studentsEnrolled: targetUser._id } });
    await User.findByIdAndDelete(targetUser._id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};