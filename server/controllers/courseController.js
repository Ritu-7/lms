import Course from "../models/Course.js";

/* ===============================
   Get all published courses
================================ */
export const getAllCourse = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select("-courseContent -enrolledStudents")
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

    const courseData = await Course.findById(id)
      .populate("educator", "name imageUrl")
      .lean();

    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // 🔒 2. Safely hide non-preview lecture URLs
    // Added optional chaining (?.) and existence checks
    if (courseData.courseContent && Array.isArray(courseData.courseContent)) {
      courseData.courseContent.forEach((chapter) => {
        if (chapter.chapterContent && Array.isArray(chapter.chapterContent)) {
          chapter.chapterContent.forEach((lecture) => {
            if (!lecture.isPreviewFree) {
              lecture.lectureUrl = ""; 
            }
          });
        }
      });
    }

    res.json({
      success: true,
      data: courseData,
    });
  } catch (error) {
    // This console.log will tell you exactly what the 500 error is in your terminal
    console.error("Error in getCourseId:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};