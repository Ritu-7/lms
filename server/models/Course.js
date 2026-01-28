import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    lectureId: String,
    lectureTitle: String,
    lectureDuration: Number,
    lectureUrl: String,
    isPreviewFree: Boolean,
    lectureOrder: Number,
  },
  { _id: false }
);

const chapterSchema = new mongoose.Schema(
  {
    chapterId: String,
    chapterOrder: Number,
    chapterTitle: String,
    chapterContent: [lectureSchema],
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    courseTitle: String,
    courseDescription: String,
    courseThumbnail: String,
    coursePrice: Number,
    discount: Number,
    isPublished: { type: Boolean, default: false },

    courseFeatures: [String],

    courseContent: [chapterSchema],

    courseRatings: [
      {
        userId: String, // Clerk ID
        rating: Number,
        review: String,
      },
    ],

    educator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

  studentsEnrolled: [
  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
],

  },
  { timestamps: true }
);

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;
