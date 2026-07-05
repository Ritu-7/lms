import Course from "../models/Course.js";
import { serializeCourseHierarchy } from "../services/courseHierarchyService.js";

/* ===============================
   Get all published courses
================================ */
export const getAllCourse = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select("-courseContent -modules -studentsEnrolled")
      .populate("educator", "name imageUrl");

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===============================
   Get course by ID
================================ */
export const getCourseId = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Validate ID format first to prevent Mongoose cast errors
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid Course ID format" });
    }

    const courseDoc = await Course.findById(id)
      .populate({ path: "modules", populate: { path: "lessons" } })
      .populate("educator", "name imageUrl")
      .lean();

    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const courseData = serializeCourseHierarchy(courseDoc, { hideRestrictedUrls: true });

    res.json({
      success: true,
      data: courseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
