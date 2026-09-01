import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import mongoose from 'mongoose';
import { saveDraftCourse } from './controllers/courseGenerationController.js';
import User from './models/User.js';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ role: 'educator' });
  if (!user) {
    console.log("No educator found");
    process.exit(1);
  }

  const req = {
    user: user,
    body: {
      draft: {
        courseTitle: "Test AI Course",
        courseDescription: "Testing save",
        category: "Test",
        modules: [
          {
            moduleTitle: "Module 1",
            lessons: [
              {
                lessonTitle: "Lesson 1",
                lessonContent: "Content",
              }
            ]
          }
        ]
      }
    }
  };

  const res = {
    status: (code) => {
      console.log("Status:", code);
      return res;
    },
    json: (data) => {
      console.log("Response:", JSON.stringify(data, null, 2));
      return res;
    }
  };

  try {
    await saveDraftCourse(req, res);
  } catch (err) {
    console.error("Unhandled error:", err);
  }
  
  process.exit(0);
})();
