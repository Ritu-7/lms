import QuizAttempt from "../models/QuizAttempt.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import PersonalNote from "../models/PersonalNote.js";
import { decryptKey } from "../utils/encryption.js";
import { callGeminiJson, callGeminiText, retryWithBackoff } from "../services/aiService.js";
import { evaluateQuizQuestion } from "../services/quizService.js";
import {
  buildStudentLearningSnapshot,
  buildCourseChatContext,
  compactSnapshotForPrompt,
} from "../services/studentLearningSnapshotService.js";
import {
  collectStudentEvidenceSkills,
  matchGapSkill,
  normalizeSkillGapResult,
} from "../services/studentSkillGapService.js";
import { pickAdaptiveNext, sanitizeQuizQuestion } from "../services/adaptiveQuizService.js";
import AIUsageLog from "../models/AIUsageLog.js";

const MODEL = "gemini-3.6-flash";

const humanizeAiFailure = (error) => {
  const raw = String(error?.message || "");
  const status = error?.statusCode || error?.status || 500;
  if (raw === "NO_API_KEY" || status === 403) {
    return {
      statusCode: 403,
      message: "Add your Gemini API key in AI Settings to use this feature. We never fall back to sample answers.",
    };
  }
  if (status === 429 || /quota|rate/i.test(raw)) {
    return {
      statusCode: 429,
      message: "The AI service is busy right now. Wait a moment and try again.",
    };
  }
  if (/unreadable|JSON|empty response/i.test(raw)) {
    return {
      statusCode: 502,
      message: "The AI returned an unreadable response. Please try again in a moment.",
    };
  }
  if (status >= 500) {
    return {
      statusCode: 502,
      message: "We could not reach the AI service. Check your key and try again.",
    };
  }
  return {
    statusCode: status >= 400 && status < 600 ? status : 500,
    message: raw && !raw.trim().startsWith("{") ? raw : "Something went wrong while generating this insight. Please try again.",
  };
};

const resolveStudent = async (clerkUserId) => {
  const user = await User.findOne({ clerkUserId });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const requireStudentKey = (user) => {
  const userApiKey = decryptKey(user.encryptedGeminiKey);
  if (!userApiKey) {
    const error = new Error("NO_API_KEY");
    error.statusCode = 403;
    throw error;
  }
  return userApiKey;
};

const isEnrolled = (user, courseId) =>
  (user.enrolledCourses || []).some((id) => id.toString() === String(courseId));

const logUsage = async ({ user, feature, status, inputLength = 0, outputLength = 0, title = "", metadata = {}, errorMessage = "" }) => {
  try {
    await AIUsageLog.create({
      user: user._id,
      feature,
      model: MODEL,
      status,
      inputLength,
      outputLength,
      title,
      sourceType: "student_ecosystem",
      metadata,
      errorMessage,
    });
  } catch {
    // ignore logging failures
  }
};

const geminiJson = (userApiKey, systemInstruction, payload, generationConfig = {}) =>
  retryWithBackoff(
    () =>
      callGeminiJson({
        model: MODEL,
        userApiKey,
        contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
        systemInstruction,
        generationConfig: { temperature: 0.25, maxOutputTokens: 4096, ...generationConfig },
      }),
    1
  );

const geminiText = (userApiKey, systemInstruction, payload, generationConfig = {}) =>
  retryWithBackoff(
    () =>
      callGeminiText({
        model: MODEL,
        userApiKey,
        contents: [{ role: "user", parts: [{ text: typeof payload === "string" ? payload : JSON.stringify(payload) }] }],
        systemInstruction,
        generationConfig: { temperature: 0.4, maxOutputTokens: 3072, ...generationConfig },
      }),
    1
  );

const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    const human = humanizeAiFailure(error);
    error.statusCode = human.statusCode;
    error.message = human.message;
    error.isOperational = true;
    next(error);
  }
};

const allowedCourseIds = (snapshot) => new Set((snapshot.enrollments || []).map((item) => item.courseId));
const catalogCourseIds = (snapshot) => new Set((snapshot.catalog || []).map((item) => item.courseId));

const computeSkillGap = async ({ user, snapshot, targetRole, userApiKey }) => {
  const evidence = collectStudentEvidenceSkills(snapshot);
  const catalog = snapshot.catalog || [];
  const raw = await geminiJson(
    userApiKey,
    `You map a learner to a target role using ONLY the provided evidence and catalog.
Return JSON: {"target": string, "presentSkills": string[], "gaps":[{"skill": string, "whyMissing": string, "evidenceChecked": string[], "recommendedResources":[{"courseId": string, "lessonId": string, "reason": string}]}]}
Rules:
- recommendedResources.courseId MUST be copied from catalog.courseId. lessonId MUST be copied from catalog.lessons when used.
- Never invent courses, lessons, certificates, or skills the student has that are not in evidence.
- This is a gap-to-course mapping tool only. Do not write a career-readiness narrative or overall score.
- If evidence already covers a skill, do not list it as missing.`,
    {
      targetRole,
      evidence,
      enrollments: compactSnapshotForPrompt(snapshot).enrollments,
      quizzes: snapshot.quizzes,
      assignments: snapshot.assignments,
      certificates: snapshot.certificates,
      catalog: catalog.map((course) => ({
        courseId: course.courseId,
        title: course.title,
        category: course.category,
        features: course.features,
        lessons: (course.lessons || []).slice(0, 12),
      })),
    }
  );
  return normalizeSkillGapResult({ ...raw, target: targetRole }, catalog, evidence);
};

export const saveStudentAiProfile = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const learningGoals = typeof req.body?.learningGoals === "string" ? req.body.learningGoals.trim().slice(0, 800) : user.learningGoals;
  const targetRole = typeof req.body?.targetRole === "string" ? req.body.targetRole.trim().slice(0, 160) : user.targetRole;
  user.learningGoals = learningGoals;
  user.targetRole = targetRole;
  await user.save();
  res.json({ success: true, data: { learningGoals: user.learningGoals, targetRole: user.targetRole } });
});

export const getStudentLearningSnapshot = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const snapshot = await buildStudentLearningSnapshot(user);
  res.json({
    success: true,
    data: {
      profile: snapshot.profile,
      enrollments: snapshot.enrollments.map((course) => ({
        courseId: course.courseId,
        title: course.title,
        progressPct: course.progressPct,
        completedCount: course.completedCount,
        totalLessons: course.totalLessons,
        incompleteLessons: course.incompleteLessons,
      })),
      quizzes: snapshot.quizzes,
      assignments: snapshot.assignments,
      certificates: snapshot.certificates,
      activity: snapshot.activity,
      codingPractice: snapshot.codingPractice,
      weakQuizAreas: snapshot.weakQuizAreas,
    },
  });
});

export const generateLearningPath = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const userApiKey = requireStudentKey(user);
  const snapshot = await buildStudentLearningSnapshot(user);
  const compact = compactSnapshotForPrompt(snapshot);
  if (!compact.enrollments.length) {
    return res.json({
      success: true,
      data: { steps: [], emptyReason: "Enroll in a course first. The learning path is built from your real enrollments and progress." },
    });
  }

  const raw = await geminiJson(
    userApiKey,
    `Create a personal learning path for this enrolled student.
Return JSON: {"steps":[{"kind":"lesson"|"course"|"practice","title": string, "courseId": string, "lessonId": string, "reason": string}]}
Rules:
- kind=lesson must use an enrolled courseId and a real incomplete or weak lessonId from the payload.
- kind=course may use a catalog courseId the student is not enrolled in.
- kind=practice must reference a real quizId or assignmentId from the payload (put it in lessonId).
- Every reason must cite a real metric (score, incomplete lesson, activity).
- Do not write skill-gap maps or diagnostic trend essays.
- Maximum 8 steps. Ordered as the next sequence to take.`,
    { student: compact, catalog: (snapshot.catalog || []).slice(0, 24) }
  );

  const enrolled = allowedCourseIds(snapshot);
  const catalog = catalogCourseIds(snapshot);
  const lessonIndex = new Map();
  for (const course of snapshot.enrollments) {
    for (const lesson of course.lessons || []) {
      lessonIndex.set(`${course.courseId}:${lesson.lessonId}`, lesson);
    }
  }
  const quizIds = new Set((snapshot.quizzes || []).map((item) => item.quizId));
  const assignmentIds = new Set((snapshot.assignments || []).map((item) => item.assignmentId));

  const steps = (Array.isArray(raw.steps) ? raw.steps : [])
    .map((step) => ({
      kind: ["lesson", "course", "practice"].includes(step.kind) ? step.kind : "lesson",
      title: String(step.title || "").trim(),
      courseId: String(step.courseId || "").trim(),
      lessonId: String(step.lessonId || "").trim(),
      reason: String(step.reason || "").trim(),
    }))
    .filter((step) => {
      if (!step.title || !step.reason) return false;
      if (step.kind === "lesson") return enrolled.has(step.courseId) && lessonIndex.has(`${step.courseId}:${step.lessonId}`);
      if (step.kind === "course") return catalog.has(step.courseId);
      return quizIds.has(step.lessonId) || assignmentIds.has(step.lessonId);
    })
    .map((step) => ({
      ...step,
      hrefHint: step.kind === "practice"
        ? (quizIds.has(step.lessonId) ? "quiz" : "assignment")
        : (step.kind === "course" && !enrolled.has(step.courseId) ? "catalog" : "player"),
    }))
    .slice(0, 8);

  await logUsage({ user, feature: "learning_path", status: "success", title: "Learning path", outputLength: JSON.stringify(steps).length });
  res.json({ success: true, data: { steps, generatedAt: new Date().toISOString() } });
});

export const generateStudyCoach = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const userApiKey = requireStudentKey(user);
  const snapshot = await buildStudentLearningSnapshot(user);
  const compact = compactSnapshotForPrompt(snapshot);
  const question = String(req.body?.question || "").trim();

  if (!compact.enrollments.length && !compact.quizzes.length) {
    return res.json({
      success: true,
      data: {
        actions: [],
        reply: "",
        emptyReason: "Once you enroll and start lessons or quizzes, the coach will suggest what to do next from that activity.",
      },
    });
  }

  const raw = await geminiJson(
    userApiKey,
    `You are an action-oriented study coach. Suggest the next concrete actions from this student's real data.
Return JSON: {"actions":[{"title": string, "why": string, "courseId": string, "hrefHint": "player"|"quiz"|"assignment","entityId": string}], "reply": string}
Rules:
- Actions only: "do this next". Do not explain long-term trends (that's analytics) and do not output a multi-course sequence (that's the learning path).
- hrefHint player uses courseId; quiz uses a real quizId in entityId; assignment uses assignmentId.
- reply answers the student's question using only this data. If no question, reply can be a short coaching summary.
- Never invent assessments or lessons.`,
    { student: compact, question }
  );

  const enrolled = allowedCourseIds(snapshot);
  const quizIds = new Set((snapshot.quizzes || []).map((item) => item.quizId));
  const assignmentIds = new Set((snapshot.assignments || []).map((item) => item.assignmentId));
  const actions = (Array.isArray(raw.actions) ? raw.actions : [])
    .map((item) => ({
      title: String(item.title || "").trim(),
      why: String(item.why || "").trim(),
      courseId: String(item.courseId || "").trim(),
      hrefHint: ["player", "quiz", "assignment"].includes(item.hrefHint) ? item.hrefHint : "player",
      entityId: String(item.entityId || item.courseId || "").trim(),
    }))
    .filter((item) => {
      if (!item.title || !item.why) return false;
      if (item.hrefHint === "quiz") return quizIds.has(item.entityId);
      if (item.hrefHint === "assignment") return assignmentIds.has(item.entityId);
      return !item.courseId || enrolled.has(item.courseId);
    })
    .slice(0, 6);

  await logUsage({ user, feature: "study_coach", status: "success", title: "Study coach", inputLength: question.length });
  res.json({ success: true, data: { actions, reply: String(raw.reply || "").trim(), generatedAt: new Date().toISOString() } });
});

export const generateLearningAnalytics = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const userApiKey = requireStudentKey(user);
  const snapshot = await buildStudentLearningSnapshot(user);
  const compact = compactSnapshotForPrompt(snapshot);

  if (!compact.enrollments.length) {
    return res.json({
      success: true,
      data: { trends: [], emptyReason: "Analytics appear after you have enrollment and progress records." },
    });
  }

  const raw = await geminiJson(
    userApiKey,
    `Explain this student's learning trends in plain language.
Return JSON: {"summary": string, "trends":[{"title": string, "observation": string, "why": string, "recommendation": string, "evidence": string[]}]}
Rules:
- Explain what is happening and why. Do not generate a course sequence. Do not map skills to catalog courses.
- Every evidence item must be a real number, date, course, quiz, or assignment from the payload.
- Max 6 trends.`,
    { student: compact }
  );

  const trends = (Array.isArray(raw.trends) ? raw.trends : [])
    .map((item) => ({
      title: String(item.title || "").trim(),
      observation: String(item.observation || "").trim(),
      why: String(item.why || "").trim(),
      recommendation: String(item.recommendation || "").trim(),
      evidence: Array.isArray(item.evidence) ? item.evidence.map(String).slice(0, 6) : [],
    }))
    .filter((item) => item.title && item.observation)
    .slice(0, 6);

  await logUsage({ user, feature: "learning_analytics", status: "success", title: "Learning analytics" });
  res.json({
    success: true,
    data: {
      summary: String(raw.summary || "").trim(),
      trends,
      generatedAt: new Date().toISOString(),
    },
  });
});

export const generateSkillGap = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const userApiKey = requireStudentKey(user);
  const targetRole = String(req.body?.targetRole || user.targetRole || "").trim();
  if (!targetRole) {
    return res.status(400).json({ success: false, message: "Choose a target role or skill goal first." });
  }
  user.targetRole = targetRole;
  await user.save();
  const snapshot = await buildStudentLearningSnapshot(user);
  const result = await computeSkillGap({ user, snapshot, targetRole, userApiKey });
  user.lastSkillGap = result;
  await user.save();
  await logUsage({ user, feature: "skill_gap", status: "success", title: targetRole });
  res.json({ success: true, data: { ...result, generatedAt: new Date().toISOString() } });
});

export const generateCareerReadiness = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const userApiKey = requireStudentKey(user);
  const targetRole = String(req.body?.targetRole || user.targetRole || "").trim();
  if (!targetRole) {
    return res.status(400).json({ success: false, message: "Choose a target role first." });
  }
  user.targetRole = targetRole;
  await user.save();
  const snapshot = await buildStudentLearningSnapshot(user);
  const evidenceSkills = collectStudentEvidenceSkills(snapshot);
  const cached = user.lastSkillGap;
  const reuseCached = cached?.target && String(cached.target).toLowerCase() === targetRole.toLowerCase();
  const gaps = reuseCached
    ? normalizeSkillGapResult(cached, snapshot.catalog || [], evidenceSkills)
    : await computeSkillGap({ user, snapshot, targetRole, userApiKey });
  if (!reuseCached) {
    user.lastSkillGap = gaps;
    await user.save();
  }

  const raw = await geminiJson(
    userApiKey,
    `Write a holistic career-readiness view. Reuse the provided skill-gap mapping; do not recompute or invent new gaps.
Return JSON: {"summary": string, "strengths":[{"title": string, "evidence": string[]}], "nextSteps":[{"title": string, "evidence": string[]}], "gapReferences":[{"skill": string, "note": string}]}
Rules:
- Every insight must include supporting evidence copied from the payload (course titles, scores, certificates, coding runs).
- Do not invent projects, certificates, or skills.
- gapReferences must only mention skills already in skillGap.gaps.`,
    {
      targetRole,
      student: compactSnapshotForPrompt(snapshot),
      skillGap: gaps,
      evidenceSkills,
    }
  );

  const allowedGapSkills = new Set(gaps.gaps.map((item) => item.skill));
  const data = {
    targetRole,
    summary: String(raw.summary || "").trim(),
    strengths: (Array.isArray(raw.strengths) ? raw.strengths : [])
      .map((item) => ({
        title: String(item.title || "").trim(),
        evidence: Array.isArray(item.evidence) ? item.evidence.map(String).slice(0, 6) : [],
      }))
      .filter((item) => item.title && item.evidence.length)
      .slice(0, 6),
    nextSteps: (Array.isArray(raw.nextSteps) ? raw.nextSteps : [])
      .map((item) => ({
        title: String(item.title || "").trim(),
        evidence: Array.isArray(item.evidence) ? item.evidence.map(String).slice(0, 6) : [],
      }))
      .filter((item) => item.title)
      .slice(0, 6),
    gapReferences: (Array.isArray(raw.gapReferences) ? raw.gapReferences : [])
      .map((item) => {
        const skill = matchGapSkill(item.skill, [...allowedGapSkills]) || String(item.skill || "").trim();
        return {
          skill,
          note: String(item.note || "").trim(),
        };
      })
      .filter((item) => allowedGapSkills.has(item.skill))
      .slice(0, 8),
    skillGap: gaps,
    generatedAt: new Date().toISOString(),
  };

  await logUsage({ user, feature: "career_readiness", status: "success", title: targetRole });
  res.json({ success: true, data });
});

export const generatePortfolioDraft = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const userApiKey = requireStudentKey(user);
  const snapshot = await buildStudentLearningSnapshot(user);
  const evidenceSkills = collectStudentEvidenceSkills(snapshot);

  const completedCourses = (snapshot.enrollments || []).filter((course) => course.progressPct >= 100);
  const gradedProjects = (snapshot.assignments || []).filter((item) => item.status === "graded");
  const codingTitles = [];
  if (snapshot.codingPractice?.runCount) {
    codingTitles.push(`${snapshot.codingPractice.lastLanguage || "Code"} practice`);
  }
  (snapshot.codingPractice?.recentSessions || []).forEach((session) => {
    if (session.title) codingTitles.push(session.title);
  });

  if (!completedCourses.length && !snapshot.certificates.length && !gradedProjects.length && !codingTitles.length) {
    return res.json({
      success: true,
      data: {
        draft: null,
        emptyReason: "Portfolio content is generated only from completed courses, graded assignments, certificates, and recorded coding practice. None of those exist yet.",
      },
    });
  }

  const allowedProjectTitles = [...new Set([...gradedProjects.map((item) => item.title), ...codingTitles])];

  const raw = await geminiJson(
    userApiKey,
    `Generate professional portfolio copy strictly from the provided records.
Return JSON: {"headline": string, "summary": string, "skills": string[], "courses":[{"title": string, "blurb": string}], "projects":[{"title": string, "blurb": string, "source": string}], "certificates":[{"title": string, "blurb": string}], "achievements": string[]}
Rules:
- Never invent a project, skill, certificate, course, or achievement that is not in the payload.
- projects.title MUST be copied from allowedProjectTitles.
- skills may only come from evidenceSkills or completed course features/categories.
- Keep copy concise and professional.`,
    {
      profile: snapshot.profile,
      completedCourses,
      certificates: snapshot.certificates,
      gradedProjects,
      allowedProjectTitles,
      codingPractice: snapshot.codingPractice,
      evidenceSkills,
    }
  );

  const allowedCourseTitles = new Set(completedCourses.map((item) => item.title));
  const allowedCerts = new Set(snapshot.certificates.map((item) => item.courseTitle));
  const allowedProjects = new Set(allowedProjectTitles);
  const allowedSkills = new Set(evidenceSkills.map((item) => item.skill.toLowerCase()));

  const allowedTitles = [
    ...completedCourses.map((item) => item.title),
    ...snapshot.certificates.map((item) => item.courseTitle),
    ...gradedProjects.map((item) => item.title),
    ...evidenceSkills.map((item) => item.skill),
  ].filter(Boolean);
  const allowedTitleLower = allowedTitles.map((item) => item.toLowerCase());

  const draft = {
    headline: String(raw.headline || `${snapshot.profile.name} — Learner`).trim(),
    summary: String(raw.summary || "").trim(),
    skills: (Array.isArray(raw.skills) ? raw.skills : []).map(String).filter((skill) => allowedSkills.has(skill.toLowerCase())).slice(0, 16),
    courses: (Array.isArray(raw.courses) ? raw.courses : [])
      .filter((item) => allowedCourseTitles.has(item.title))
      .map((item) => ({ title: item.title, blurb: String(item.blurb || "").trim() })),
    projects: (Array.isArray(raw.projects) ? raw.projects : [])
      .filter((item) => allowedProjects.has(String(item.title || "").trim()))
      .map((item) => ({ title: String(item.title || "").trim(), blurb: String(item.blurb || "").trim(), source: String(item.source || "").trim() })),
    certificates: (Array.isArray(raw.certificates) ? raw.certificates : [])
      .filter((item) => allowedCerts.has(item.title))
      .map((item) => ({ title: item.title, blurb: String(item.blurb || "").trim() })),
    achievements: (Array.isArray(raw.achievements) ? raw.achievements : [])
      .map(String)
      .filter((item) => allowedTitleLower.some((title) => item.toLowerCase().includes(title)))
      .slice(0, 8),
  };

  await logUsage({ user, feature: "portfolio_generator", status: "success", title: "Portfolio draft" });
  res.json({ success: true, data: { draft, saved: false } });
});

export const savePortfolio = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const incoming = req.body?.portfolio;
  if (!incoming || typeof incoming !== "object") {
    return res.status(400).json({ success: false, message: "Edited portfolio content is required before saving." });
  }
  const snapshot = await buildStudentLearningSnapshot(user);
  const completedTitles = new Set((snapshot.enrollments || []).filter((c) => c.progressPct >= 100).map((c) => c.title));
  const certTitles = new Set((snapshot.certificates || []).map((c) => c.courseTitle));
  const projectTitles = new Set([
    ...(snapshot.assignments || []).filter((a) => a.status === "graded").map((a) => a.title),
    ...(snapshot.codingPractice?.runCount ? [`${snapshot.codingPractice.lastLanguage || "Code"} practice`] : []),
    ...((snapshot.codingPractice?.recentSessions || []).map((session) => session.title).filter(Boolean)),
  ]);
  const evidenceSkills = new Set(collectStudentEvidenceSkills(snapshot).map((s) => s.skill.toLowerCase()));

  const published = {
    headline: String(incoming.headline || "").trim().slice(0, 160),
    summary: String(incoming.summary || "").trim().slice(0, 2000),
    skills: (Array.isArray(incoming.skills) ? incoming.skills : []).map(String).filter((skill) => evidenceSkills.has(skill.toLowerCase())).slice(0, 20),
    courses: (Array.isArray(incoming.courses) ? incoming.courses : [])
      .filter((item) => completedTitles.has(item.title))
      .map((item) => ({ title: item.title, blurb: String(item.blurb || "").trim().slice(0, 400) })),
    projects: (Array.isArray(incoming.projects) ? incoming.projects : [])
      .filter((item) => projectTitles.has(String(item.title || "").trim()))
      .map((item) => ({ title: String(item.title || "").trim(), blurb: String(item.blurb || "").trim().slice(0, 400), source: String(item.source || "").trim() })),
    certificates: (Array.isArray(incoming.certificates) ? incoming.certificates : [])
      .filter((item) => certTitles.has(item.title))
      .map((item) => ({ title: item.title, blurb: String(item.blurb || "").trim().slice(0, 400) })),
    achievements: (Array.isArray(incoming.achievements) ? incoming.achievements : [])
      .map(String)
      .filter((item) => {
        const lower = item.toLowerCase();
        return [...completedTitles, ...certTitles, ...projectTitles, ...evidenceSkills].some((title) =>
          String(title).toLowerCase() && lower.includes(String(title).toLowerCase())
        );
      })
      .slice(0, 8),
    updatedAt: new Date().toISOString(),
  };

  user.portfolioDraft = incoming;
  user.portfolioPublished = published;
  await user.save();
  res.json({ success: true, data: { portfolio: published } });
});

export const getPortfolio = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  res.json({
    success: true,
    data: {
      draft: user.portfolioDraft || null,
      published: user.portfolioPublished || null,
      learningGoals: user.learningGoals || "",
      targetRole: user.targetRole || "",
    },
  });
});

export const chatWithCourse = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const userApiKey = requireStudentKey(user);
  const courseId = String(req.body?.courseId || "").trim();
  const question = String(req.body?.question || "").trim();
  const currentLessonId = String(req.body?.currentLessonId || "").trim();
  const history = Array.isArray(req.body?.messages) ? req.body.messages.slice(-8) : [];
  if (!courseId || !question) {
    return res.status(400).json({ success: false, message: "Ask a question about the course you are viewing." });
  }
  if (!isEnrolled(user, courseId) && user.role !== "admin") {
    return res.status(403).json({ success: false, message: "You can only chat about courses you are enrolled in." });
  }

  const course = await Course.findById(courseId)
    .populate({ path: "modules", populate: { path: "lessons" } })
    .lean();
  if (!course) return res.status(404).json({ success: false, message: "Course not found." });

  const courseNotes = await PersonalNote.find({ user: user._id, course: course._id })
    .sort({ updatedAt: -1 })
    .limit(12)
    .lean();
  const context = buildCourseChatContext(course, courseNotes, currentLessonId);

  const raw = await geminiJson(
    userApiKey,
    `Answer using ONLY this course's lessons, PDFs, notes excerpts, and the student's notes for THIS course. Never use other courses.
Return JSON: {"answer": string, "citations":[{"lessonId": string, "lessonTitle": string, "chapterTitle": string, "section": string}]}
If the answer is not in the course materials, say so and cite nothing invented. Citations must copy lessonId from the payload.`,
    {
      ...context,
      question,
      history,
    }
  );

  const lessonMap = new Map((context.lessons || []).map((item) => [item.lessonId, item]));
  const citations = (Array.isArray(raw.citations) ? raw.citations : [])
    .map((item) => {
      const lesson = lessonMap.get(String(item.lessonId || ""));
      if (!lesson) return null;
      return {
        lessonId: lesson.lessonId,
        lessonTitle: lesson.title,
        chapterTitle: lesson.chapterTitle,
        section: String(item.section || lesson.chapterTitle || "").trim(),
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  await logUsage({ user, feature: "chat_with_course", status: "success", title: course.courseTitle, inputLength: question.length });
  res.json({
    success: true,
    data: {
      answer: String(raw.answer || "").trim(),
      citations,
    },
  });
});

const clipPrompt = (value) => String(value || "").slice(0, 80);

export const adaptiveQuizStep = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const quizId = String(req.body?.quizId || req.params?.quizId || "").trim();
  const questionId = String(req.body?.questionId || "").trim();
  const answeredIds = Array.isArray(req.body?.answeredIds) ? req.body.answeredIds.map(String) : [];
  const response = req.body?.response || {};
  const startOnly = Boolean(req.body?.startOnly);

  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found." });
  if (!isEnrolled(user, quiz.course) && user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Enrollment required to take this assessment." });
  }

  const remainingStart = (quiz.questions || []).filter((item) => !answeredIds.includes(String(item.questionId)));
  if (startOnly || !questionId) {
    const lastAnswered = [...(quiz.questions || [])]
      .reverse()
      .find((item) => answeredIds.includes(String(item.questionId)));
    let lastCorrect = true;
    if (lastAnswered) {
      const inProgressAttempt = await QuizAttempt.findOne({ quiz: quiz._id, student: user._id, status: "in_progress" }).sort({ attemptNumber: -1 });
      const lastAttemptResponse = inProgressAttempt?.responses?.find((item) => String(item.questionId) === String(lastAnswered.questionId));
      if (lastAttemptResponse) lastCorrect = Boolean(lastAttemptResponse.isCorrect);
    }
    const first = pickAdaptiveNext(remainingStart, {
      lastCorrect,
      lastQuestion: lastAnswered || { difficulty: "medium", points: 2 },
      quizTags: quiz.tags,
    })
      || remainingStart[0]
      || null;
    return res.json({
      success: true,
      data: {
        questionId: null,
        isCorrect: null,
        nextQuestion: sanitizeQuizQuestion(first),
        remainingCount: remainingStart.length,
        weakConcept: null,
      },
    });
  }

  const question = (quiz.questions || []).find((item) => String(item.questionId) === questionId);
  if (!question) return res.status(404).json({ success: false, message: "Question not found." });

  const evaluation = evaluateQuizQuestion(question, response);
  const remaining = (quiz.questions || []).filter((item) => !answeredIds.includes(String(item.questionId)) && String(item.questionId) !== questionId);
  const nextQuestion = pickAdaptiveNext(remaining, {
    lastCorrect: evaluation.isCorrect,
    lastQuestion: question,
    quizTags: quiz.tags,
  });

  let explanation = evaluation.explanation || question.explanation || "";
  if (!explanation) {
    try {
      const userApiKey = requireStudentKey(user);
      explanation = await geminiText(
        userApiKey,
        "Explain this quiz item briefly for the student. Do not reveal other questions. Base the explanation only on this question and its correct answer.",
        {
          prompt: question.prompt,
          questionType: question.questionType,
          isCorrect: evaluation.isCorrect,
          feedback: evaluation.feedback,
          correctAnswer: evaluation.correctAnswer,
        },
        { temperature: 0.2, maxOutputTokens: 400 }
      );
    } catch (error) {
      const human = humanizeAiFailure(error);
      explanation = evaluation.feedback || human.message;
    }
  }

  const attempt = await QuizAttempt.findOne({ quiz: quiz._id, student: user._id, status: "in_progress" }).sort({ attemptNumber: -1 });
  if (attempt) {
    const nextResponses = [
      ...(attempt.responses || []).filter((item) => String(item.questionId) !== questionId),
      {
        questionId,
        questionType: question.questionType,
        selectedOptions: Array.isArray(response.selectedOptions) ? response.selectedOptions.map(String) : [],
        textAnswer: String(response.textAnswer || ""),
        isCorrect: Boolean(evaluation.isCorrect),
        scoreAwarded: Number(evaluation.scoreAwarded || 0),
        maxScore: Number(question.points || 0),
        feedback: evaluation.feedback || "",
        explanation,
      },
    ];
    attempt.responses = nextResponses;
    await attempt.save();
  }

  const weakConcept = evaluation.isCorrect ? null : clipPrompt(question.prompt);

  res.json({
    success: true,
    data: {
      questionId,
      isCorrect: Boolean(evaluation.isCorrect),
      scoreAwarded: Number(evaluation.scoreAwarded || 0),
      maxScore: Number(question.points || 0),
      feedback: evaluation.feedback,
      explanation,
      nextQuestion: sanitizeQuizQuestion(nextQuestion),
      nextQuestionId: nextQuestion?.questionId || null,
      remainingCount: remaining.length,
      weakConcept,
    },
  });
});

export const generateExamPrep = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const userApiKey = requireStudentKey(user);
  const quizId = String(req.body?.quizId || "").trim();
  const snapshot = await buildStudentLearningSnapshot(user);

  if (!snapshot.enrollments.length && !snapshot.quizzes.length && !quizId) {
    return res.json({
      success: true,
      data: {
        topics: [],
        practiceQuestions: [],
        weakAreaFocus: [],
        emptyReason: "Exam prep is built from your enrolled course content and past assessment scores. Enroll and take a quiz first.",
      },
    });
  }

  let focusQuiz = null;
  if (quizId) {
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return res.status(404).json({ success: false, message: "Assessment not found." });
    if (!isEnrolled(user, quiz.course) && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Enrollment required." });
    }
    focusQuiz = {
      quizId: String(quiz._id),
      title: quiz.title,
      tags: quiz.tags || [],
      courseId: String(quiz.course),
      questions: (quiz.questions || []).map((item) => ({
        questionId: item.questionId,
        prompt: item.prompt,
        questionType: item.questionType,
        points: item.points,
      })),
    };
  }

  const raw = await geminiJson(
    userApiKey,
    `Create an exam prep plan from this student's real assessment history and course progress.
Return JSON: {"focusTitle": string, "topics":[{"topic": string, "rank": number, "why": string, "courseId": string, "lessonId": string}], "practiceQuestions":[{"prompt": string, "hint": string, "sourceLesson": string}], "weakAreaFocus": string[]}
Rules:
- Rank revision topics by demonstrated weakness (low quiz %, incorrect items, incomplete lessons).
- practiceQuestions must be grounded in enrolled course lesson titles or existing quiz prompts — rewrite for practice, do not invent unrelated subjects.
- Do not claim these practice items are official scored attempts.`,
    {
      student: compactSnapshotForPrompt(snapshot),
      focusQuiz,
    }
  );

  const enrolledLessons = new Map();
  const enrolledCourseIds = new Set();
  const allowedSources = [];
  for (const course of snapshot.enrollments || []) {
    enrolledCourseIds.add(course.courseId);
    allowedSources.push(course.title);
    for (const lesson of course.lessons || []) {
      enrolledLessons.set(`${course.courseId}:${lesson.lessonId}`, lesson);
      allowedSources.push(lesson.title, lesson.chapterTitle);
    }
  }
  for (const quiz of snapshot.quizzes || []) {
    allowedSources.push(quiz.title);
  }
  if (focusQuiz) {
    allowedSources.push(focusQuiz.title);
    (focusQuiz.questions || []).forEach((item) => allowedSources.push(clipPrompt(item.prompt)));
  }
  const sourceNeedles = [...new Set(allowedSources.map((item) => String(item || "").trim().toLowerCase()).filter((item) => item.length > 3))];
  const matchesSource = (value) => {
    const hay = String(value || "").toLowerCase();
    if (!hay) return false;
    return sourceNeedles.some((needle) => hay.includes(needle) || needle.includes(hay));
  };

  const topics = (Array.isArray(raw.topics) ? raw.topics : [])
    .map((item, index) => ({
      topic: String(item.topic || "").trim(),
      rank: Number(item.rank || index + 1),
      why: String(item.why || "").trim(),
      courseId: String(item.courseId || "").trim(),
      lessonId: String(item.lessonId || "").trim(),
    }))
    .filter((item) => {
      if (!item.topic || !item.why) return false;
      if (item.courseId && !enrolledCourseIds.has(item.courseId)) return false;
      if (item.lessonId && item.courseId && !enrolledLessons.has(`${item.courseId}:${item.lessonId}`)) {
        item.lessonId = "";
      }
      return true;
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8);

  await logUsage({ user, feature: "exam_prep", status: "success", title: focusQuiz?.title || "Exam prep" });
  res.json({
    success: true,
    data: {
      focusTitle: String(raw.focusTitle || focusQuiz?.title || "Exam preparation").trim(),
      topics,
      practiceQuestions: (Array.isArray(raw.practiceQuestions) ? raw.practiceQuestions : [])
        .map((item) => ({
          prompt: String(item.prompt || "").trim(),
          hint: String(item.hint || "").trim(),
          sourceLesson: String(item.sourceLesson || "").trim(),
        }))
        .filter((item) => item.prompt && (matchesSource(item.sourceLesson) || matchesSource(item.prompt)))
        .slice(0, 8),
      weakAreaFocus: Array.isArray(raw.weakAreaFocus) ? raw.weakAreaFocus.map(String).slice(0, 8) : [],
      generatedAt: new Date().toISOString(),
    },
  });
});

export const generateCodingHint = wrap(async (req, res) => {
  const user = await resolveStudent(req.clerkUserId);
  const userApiKey = requireStudentKey(user);
  const { code = "", language = "javascript", execution = null, hintLevel = 1 } = req.body || {};
  if (!String(code).trim()) {
    return res.status(400).json({ success: false, message: "Code is required." });
  }
  const level = Math.min(3, Math.max(1, Number(hintLevel) || 1));
  const guidance = {
    1: "Give a conceptual nudge only. Do not provide corrected code.",
    2: "Point to the likely line or function and explain the issue. Show at most one short snippet.",
    3: "Provide a more complete explanation and a corrected approach, still teaching rather than dumping a full solution first.",
  };

  const executionPayload = execution && typeof execution === "object" ? {
    stdout: execution.stdout || "",
    stderr: execution.stderr || "",
    compileError: execution.compileError || "",
    exitCode: execution.exitCode,
    success: Boolean(execution.success),
    output: execution.output || "",
  } : null;

  const text = await geminiText(
    userApiKey,
    `You are a coding practice coach. Hints must be progressive. ${guidance[level]}
Discuss complexity (time/space) only from the provided source. Never invent runtime output, test results, or errors.
If execution is missing, do not claim the program ran.`,
    {
      language,
      hintLevel: level,
      code,
      execution: executionPayload,
    }
  );

  await logUsage({
    user,
    feature: "coding_hint",
    status: "success",
    title: `${language} hint ${level}`,
    metadata: { language, hintLevel: level, hasExecution: Boolean(executionPayload) },
  });
  res.json({ success: true, data: { hint: text, hintLevel: level, execution: executionPayload } });
});
