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
    const courseData = await Course.findById(id)
      .populate("educator", "name imageUrl")
      .lean();

    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // 🔒 Hide non-preview lecture URLs
    courseData.courseContent?.forEach((chapter) => {
      chapter.chapterContent?.forEach((lecture) => {
        if (!lecture.isPreviewFree) {
          lecture.lectureUrl = "";
        }
      });
    });

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
