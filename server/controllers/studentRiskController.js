import mongoose from "mongoose";
import User from "../models/User.js";
import CourseProgress from "../models/CourseProgress.js";
import QuizAttempt from "../models/QuizAttempt.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import { decryptKey } from "../utils/encryption.js";
import AIUsageLog from "../models/AIUsageLog.js";

const resolveCurrentUser = async (clerkUserId) => {
  const user = await User.findOne({ clerkUserId }).lean();
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

export const analyzeStudentRisk = async (req, res, next) => {
  try {
    const user = req.user || (await resolveCurrentUser(req.clerkUserId));
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const userApiKey = decryptKey(user.encryptedGeminiKey);
    if (!userApiKey) {
      const err = new Error("NO_API_KEY");
      err.status = 403;
      throw err;
    }

    const students = await User.find({ role: "student", status: "active" }).select("_id name email createdAt").lean();
    
    // Safety check - limit to 50 for prompt context limits
    const limitedStudents = students.slice(0, 50);
    const studentIds = limitedStudents.map(s => s._id.toString());
    const studentObjectIds = limitedStudents.map(s => s._id);

    const [progresses, quizzes, assignments] = await Promise.all([
      CourseProgress.find({ userId: { $in: studentIds } }).lean(),
      QuizAttempt.find({ student: { $in: studentObjectIds } }).lean(),
      AssignmentSubmission.find({ student: { $in: studentObjectIds } }).lean()
    ]);

    const studentDataMap = {};
    limitedStudents.forEach(s => {
      studentDataMap[s._id.toString()] = {
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        enrolledDays: Math.floor((new Date() - new Date(s.createdAt)) / (1000 * 60 * 60 * 24)),
        coursesInProgress: 0,
        completedLessons: 0,
        quizScores: [],
        assignmentScores: [],
        lastActivity: s.createdAt,
      };
    });

    progresses.forEach(p => {
      if (studentDataMap[p.userId]) {
        studentDataMap[p.userId].coursesInProgress += 1;
        studentDataMap[p.userId].completedLessons += (p.completedLessons?.length || 0);
        const updated = new Date(p.updatedAt);
        if (updated > new Date(studentDataMap[p.userId].lastActivity)) {
          studentDataMap[p.userId].lastActivity = updated;
        }
      }
    });

    quizzes.forEach(q => {
      const sId = q.student.toString();
      if (studentDataMap[sId]) {
        studentDataMap[sId].quizScores.push(q.percentage || 0);
        const updated = new Date(q.updatedAt);
        if (updated > new Date(studentDataMap[sId].lastActivity)) {
          studentDataMap[sId].lastActivity = updated;
        }
      }
    });

    assignments.forEach(a => {
      const sId = a.student.toString();
      if (studentDataMap[sId]) {
        const score = a.maxScore > 0 ? (a.totalScore / a.maxScore) * 100 : 0;
        studentDataMap[sId].assignmentScores.push(score);
        const updated = new Date(a.updatedAt);
        if (updated > new Date(studentDataMap[sId].lastActivity)) {
          studentDataMap[sId].lastActivity = updated;
        }
      }
    });

    const compiledData = Object.values(studentDataMap).map(s => {
      const avgQuiz = s.quizScores.length ? Math.round(s.quizScores.reduce((a,b)=>a+b,0)/s.quizScores.length) : null;
      const avgAssignment = s.assignmentScores.length ? Math.round(s.assignmentScores.reduce((a,b)=>a+b,0)/s.assignmentScores.length) : null;
      const daysSinceLastActivity = Math.floor((new Date() - new Date(s.lastActivity)) / (1000 * 60 * 60 * 24));
      
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        daysSinceLastActivity,
        avgQuizScore: avgQuiz,
        avgAssignmentScore: avgAssignment,
        completedLessons: s.completedLessons
      };
    });

    const systemContext = `
You are an AI educational analyst. Analyze the provided student data and determine the risk of each student dropping behind or failing.
Risk Levels: Low, Medium, High.
High Risk indicates very low activity (e.g., > 14 days inactive), low scores (< 50%), or no progress.
Medium Risk indicates some inactivity (7-14 days) or average scores (50-70%).
Low Risk indicates active engagement and good scores.

Output valid JSON ONLY. The output must be an array of objects, one for each student, with EXACTLY this structure:
[
  {
    "studentId": "id_here",
    "riskLevel": "High" | "Medium" | "Low",
    "reasons": ["reason 1", "reason 2"],
    "recommendations": ["actionable advice 1", "actionable advice 2"]
  }
]
`;

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: userApiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: JSON.stringify(compiledData),
      config: {
        systemInstruction: systemContext,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    let responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error("No response from AI");
    
    if (responseText.startsWith('\`\`\`json')) {
       responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
    }

    const parsedRiskData = JSON.parse(responseText);

    const finalData = parsedRiskData.map(risk => {
      const s = studentDataMap[risk.studentId] || {};
      const avgQuiz = s.quizScores && s.quizScores.length ? Math.round(s.quizScores.reduce((a,b)=>a+b,0)/s.quizScores.length) : null;
      const avgAssignment = s.assignmentScores && s.assignmentScores.length ? Math.round(s.assignmentScores.reduce((a,b)=>a+b,0)/s.assignmentScores.length) : null;
      
      return {
        ...risk,
        studentName: s.name || "Unknown",
        studentEmail: s.email || "Unknown",
        daysSinceLastActivity: s.daysSinceLastActivity ?? null,
        avgQuizScore: avgQuiz,
        avgAssignmentScore: avgAssignment,
      };
    });

    const aiUsage = new AIUsageLog({
        user: user._id,
        feature: "student_risk",
        model: "gemini-3.6-flash",
        status: "success",
        inputLength: JSON.stringify(compiledData).length,
        outputLength: responseText.length,
        title: "Student Risk Detection"
    });
    await aiUsage.save();

    res.json({ success: true, data: finalData });
  } catch (error) {
    if (error.message === "NO_API_KEY" || error.status === 403) {
      return res.status(403).json({ success: false, message: "No API key configured for AI features." });
    }
    
    if (req.clerkUserId) {
        const user = await User.findOne({ clerkUserId: req.clerkUserId }).lean();
        if (user) {
            const aiUsage = new AIUsageLog({
                user: user._id,
                feature: "student_risk",
                model: "gemini-3.6-flash",
                status: "error",
                errorMessage: error.message,
                title: "Student Risk Detection"
            });
            await aiUsage.save();
        }
    }
    next(error);
  }
};
