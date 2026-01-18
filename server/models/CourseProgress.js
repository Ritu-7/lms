import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    courseId: {
        type: String,
        required: true
    },
 
    lectureCompleted: {
        type: [String],
        default: []
    },

    completedLectures: [
        {
            lectureId: { type: String },
            status: { type: Boolean, default: false }
        }
    ]
}, { 
    timestamps: true, 
    minimize: false 
});

export const CourseProgress = mongoose.model("CourseProgress", courseProgressSchema);