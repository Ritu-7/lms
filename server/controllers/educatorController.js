import { clerkClient } from "@clerk/express";
import Course from '../models/Course.js';
import { v2 as cloudinary } from 'cloudinary';
import Purchase from "../models/Purchase.js"; 
import User from '../models/User.js';

export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = req.auth.userId;
        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: "educator"
            }
        });
        res.json({ success: true, message: "User role updated to educator" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body;
        const imageFile = req.file;
        const educatorId = req.auth.userId;

        if (!imageFile) {
            return res.status(400).json({ success: false, message: "Course thumbnail is required" });
        }

        const parsedCourseData = await JSON.parse(courseData);
        parsedCourseData.educator = educatorId;

        const imageUpload = await cloudinary.uploader.upload(imageFile.path);
        parsedCourseData.courseThumbnail = imageUpload.secure_url;

        const newCourse = await Course.create(parsedCourseData);

        res.status(201).json({ success: true, message: "Course created successfully", course: newCourse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getEducatorCourses = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({ educator });
        res.status(200).json({ success: true, courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get educator dashboard data
export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({ educator });
        const totalCourses = courses.length;
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({ 
            courseId: { $in: courseIds }, 
            status: 'completed' 
        });
        
        const totalEarning = purchases.reduce((total, purchase) => total + purchase.amount, 0);

        const enrolledStudentsSet = [];
        for (const course of courses) {
            const students = await User.find({
                _id: { $in: course.studentsEnrolled }
            }, 'name imageUrl email');

            students.forEach(student => {
                enrolledStudentsSet.push({
                    courseTitle: course.courseTitle,
                    student
                });
            });
        }

        res.json({
            success: true,
            data: {
                totalCourses,
                totalEarning,
                totalEnrolledStudents: enrolledStudentsSet.length,
                enrolledStudents: enrolledStudentsSet
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get enrolled studnts data eith puchase data

export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({ educator });
        const courseIds = courses.map(course => course._id);
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name email imageUrl').populate('courseId', 'courseTitle');

        const enrolledStudentsData = purchases.map(purchase => ({   
            student:purchase.userId,
            courseTitle:purchase.courseId.courseTitle,
            purchaseDate:purchase.createdAt,
        }));
        res.json({ success: true, enrolledStudentsData }) 
    }
    catch(error){
        res.json({success:false,message:error.message});
    }
}