import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    // Using String for _id to match Clerk's User ID format (e.g., 'user_2p...')
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: false },
    imageUrl: { type: String, required: true },
    
    // Optional: Keep role in sync with Clerk publicMetadata for easier querying
    role: { 
        type: String, 
        enum: ['student', 'educator'], 
        default: 'student' 
    },

    // References the 'Course' model using its ObjectId for .populate()
    enrolledCourses: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Course' 
        }
    ]
}, { 
    timestamps: true 
});

// Avoids re-compilation errors during Hot Module Replacement (HMR) in development
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;