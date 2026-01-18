import Course from '../models/Course.js';
import User from '../models/User.js';
import  Purchase  from '../models/Purchase.js';
import { CourseProgress } from '../models/CourseProgress.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- 1. USER PROFILE & ENROLLMENT ---

export const getUserData = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const userData = await User.findById(userId).populate('enrolledCourses');
        
        if (!userData) return res.status(404).json({ success: false, message: "User not found" });
        
        res.status(200).json({ success: true, enrolledCourses: userData.enrolledCourses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. RAZORPAY PAYMENT LOGIC ---

export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.auth.userId;

        const courseData = await Course.findById(courseId);
        if (!courseData) return res.status(404).json({ success: false, message: "Course not found" });

        // Calculate amount in paisa (Razorpay requirement)
        const amount = Math.round((courseData.coursePrice - (courseData.discount * courseData.coursePrice / 100)) * 100);

        const options = {
            amount: amount,
            currency: process.env.CURRENCY || 'INR',
            receipt: `rcpt_${Date.now()}`,
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        // Save pending purchase receipt
        await Purchase.create({
            courseId: courseData._id,
            userId,
            amount: amount / 100,
            razorpayOrderId: razorpayOrder.id,
            status: 'pending'
        });

        res.status(200).json({ success: true, order: razorpayOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.auth.userId;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            const purchase = await Purchase.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: 'completed', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature },
                { new: true }
            );

            // Add course to user's enrolled list
            await User.findByIdAndUpdate(userId, {
                $addToSet: { enrolledCourses: purchase.courseId }
            });

            res.status(200).json({ success: true, message: "Payment verified and course unlocked" });
        } else {
            res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 3. COURSE PROGRESS TRACKING ---

export const updateUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId, lectureId } = req.body;

        let progressData = await CourseProgress.findOne({ userId, courseId });

        if (progressData) {
            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.status(400).json({ success: false, message: "Lecture already completed" });
            }
            progressData.lectureCompleted.push(lectureId);
            await progressData.save();
            return res.status(200).json({ success: true, message: "Progress updated" });
        } else {
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            });
            return res.status(201).json({ success: true, message: "Progress started and updated" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.params;
        const progressData = await CourseProgress.findOne({ userId, courseId });
        res.status(200).json({ success: true, progressData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 4. RATINGS & REVIEWS ---

export const addUserRating = async (req, res) => {
    const userId = req.auth.userId;
    const { courseId, rating, review } = req.body;

    if (!courseId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Invalid data" });
    }

    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const user = await User.findById(userId);
        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.status(403).json({ success: false, message: "You must be enrolled to rate this course" });
        }

       
        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId.toString() === userId);

        if (existingRatingIndex !== -1) {
            course.courseRatings[existingRatingIndex].rating = rating;
            course.courseRatings[existingRatingIndex].review = review;
        } else {
            course.courseRatings.push({ userId, rating, review });
        }

        await course.save();
        res.status(200).json({ success: true, message: "Rating submitted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// import Course from '../models/course.js';
// import User from '../models/User.js';
// import Stripe from 'stripe';
// // get user data
// export const getUserData = async (req, res) => {
//     try {
//         const userId = req.auth.userId;
//         const user = await User.findById(userId).select('-password');

//         if(!user) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }
//         res.status(200).json({ success: true, data: user });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }       
// };

// // users enrolled courses with lecture links

// export const   userEnrolledCourses = async (req, res) => {
//     try {
//         const userId = req.auth.userId;
//         const userData = await User.findById(userId).populate({
//             path: 'enrolledCourses',
//             populate: {
//                 path: 'lectures',
//                 select: 'title videoUrl'
//             }
//         });
        
//         res.status(200).json({ success: true, enrolledCourses: userData.enrolledCourses });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // purcahse course
// export const  purchaseCourse = async(req,res)=>{
//   try{
//     const{courseId} = req.body;
//     const userId = req.auth.userId;
//     const {origin} = req.headers;
//     const userData = await User.findById(userId).select('name email');
//     const courseData = await Course.findById(courseId).populate({path:'educator',select:'name email'}); 
//     if(!userData || !courseData){
//         return res.status(404).json({success:false,message:"User not found"})
//     }

//     const purchaseData  ={
//         courseId:courseData._id,
//         userId,
//         amount:(courseData.coursePrice-courseData.discount*courseData.coursePrice/100).toFixed(2),
//     }

//     const newPurchase = await Purchase.create(purchaseData);

//     // stripe gateway integration
//     const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
// const currency = process.env.CURRENCY.toLowerCase() || 'USD';

// // creating line item for stripe checkout session
// const lineItems = [
//     {
//         price_data: {
//             currency: currency,
//             product_data: {
//                 name: courseData.courseTitle,
//             },
//             unit_amount: Math.floor(newPurchaseData.amount * 100), // amount in cents
//         },
//         quantity: 1,
//     }
// ];

// const session = await stripeInstance.checkout.sessions.create({
//    success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
//    cancel_url: `${origin}/payment/cancel`,
// line_items: lineItems,
// metadata:{
//     purchaseId:newPurchase._id.toString(),
// },
// mode:'payment',
// });

// res.status(200).json({ success: true, sessionId: session.id });
// } catch(error){
//     res.status(500).json({success:false,message:error.message})
//   }
// };

// // update user course progress
// export const updateUserCourseProgress = async (req, res) => {
//     try {
//         const userId = req.auth.userId;
//         const { courseId, lectureId } = req.body;
//         const progressData = await CourseProgress.findOne({ userId, courseId });

//         if (!progressData) {
//             if(progressData.lectureCompleted.includes(lectureId)){
//                 return res.status(400).json({ success: false, message: "Lecture already marked as completed" });
//             }

//             progressData.lectureCompleted.push(lectureId);
//             await progressData.save();
//             return res.status(200).json({ success: true, message: "Lecture marked as completed" });
//         } else {
//             await CourseProgress.create({
//                 userId,
//                 courseId,   
//                 lectureCompleted: [lectureId]
//             });
//             return res.status(201).json({ success: true, message: "Lecture marked as completed" });
//         }
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }   
// };  
// // get user course progress
// export const getUserCourseProgress = async (req, res) => {
//     try {
//         const userId = req.auth.userId;
//         const { courseId } = req.params;
//         const progressData = await CourseProgress.findOne({ userId, courseId });        
//     }
//     catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }   }


//     // add user Ratings to course
// export const addUserRating = async (req, res) => {
// const userId = req.auth.userId;
//         const { courseId, rating, review } = req.body;

//         if(!courseId || !userId || !rating || rating < 1 || rating > 5){ {
//             return res.status(400).json({ success: false, message: "Invalid course ID or rating" });
//         }

//     try {
//         const course = await Course.findById(courseId);
//         if(!course) {
//             return res.status(404).json({ success: false, message: "Course not found" });
//         }   
//      const user = await User.findById(userId).select('name');
//      if(!user ||!user.enrolledCourses.includes(courseId)){
//       return res.status(403).json({ success: false, message: "User not enrolled in the course" });
//      });
//     }


//      const existingRatingIndex = course.ratings.findIndex(r => r.userId.toString() === userId);
//         if(existingRatingIndex !== -1) {    
//             course.ratings[existingRatingIndex].rating = rating;
//             course.ratings[existingRatingIndex].review = review;
//         } else {
//             course.ratings.push({
//                 userId,
                
//                 rating,
             
//             }
//         await course.save( );
//         res.status(200).json({ success: true, message: "Rating added/updated successfully" });
//     }       catch (error) {     
//         res.status(500).json({ success: false, message: error.message });
//     }           

//         }