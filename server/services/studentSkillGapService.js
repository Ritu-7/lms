const toId = (value) => String(value || "").trim();

export const collectStudentEvidenceSkills = (snapshot = {}) => {
  const skills = [];
  for (const course of snapshot.enrollments || []) {
    if (course.progressPct >= 100 || (course.completedCount > 0 && course.progressPct >= 70)) {
      (course.features || []).forEach((skill) => skills.push({
        skill,
        source: `Completed progress in ${course.title} (${course.progressPct}%)`,
        courseId: course.courseId,
      }));
      if (course.category) {
        skills.push({
          skill: course.category,
          source: `Course category from ${course.title}`,
          courseId: course.courseId,
        });
      }
    }
  }
  for (const quiz of snapshot.quizzes || []) {
    if (quiz.passed) {
      (quiz.tags || []).forEach((skill) => skills.push({
        skill,
        source: `Passed quiz ${quiz.title} at ${quiz.percentage}%`,
        courseId: quiz.courseId,
      }));
    }
  }
  for (const assignment of snapshot.assignments || []) {
    if (assignment.status === "graded" && Number(assignment.totalScore) >= Number(assignment.maxScore || 0) * 0.7) {
      (assignment.tags || []).forEach((skill) => skills.push({
        skill,
        source: `Graded assignment ${assignment.title}`,
        courseId: assignment.courseId,
      }));
    }
  }
  for (const cert of snapshot.certificates || []) {
    if (cert.courseTitle) {
      skills.push({
        skill: cert.courseTitle,
        source: `Certificate issued ${cert.issueDate ? new Date(cert.issueDate).toISOString().slice(0, 10) : ""}`.trim(),
      });
    }
  }
  const coding = snapshot.codingPractice || {};
  if (coding.lastLanguage && coding.runCount) {
    skills.push({
      skill: coding.lastLanguage,
      source: `${coding.runCount} recorded coding run${coding.runCount === 1 ? "" : "s"} (${coding.lastSuccess ? "last run succeeded" : "last run had errors"})`,
    });
  }
  (coding.recentSessions || []).forEach((session) => {
    if (session.language) {
      skills.push({
        skill: session.language,
        source: `Coding practice session${session.createdAt ? ` on ${new Date(session.createdAt).toISOString().slice(0, 10)}` : ""}`.trim(),
      });
    }
  });
  return skills;
};

export const autoMatchCatalog = (skill, catalog = []) => {
  const tokens = String(skill || "")
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 2);
  if (!tokens.length) return [];

  const scored = [];
  for (const course of catalog || []) {
    const hay = [
      course.title,
      course.category,
      ...(course.features || []),
      ...(course.lessons || []).map((lesson) => `${lesson.title} ${lesson.chapterTitle}`),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const hits = tokens.filter((token) => hay.includes(token)).length;
    if (!hits) continue;
    const lesson = (course.lessons || []).find((item) =>
      tokens.some((token) => `${item.title} ${item.chapterTitle}`.toLowerCase().includes(token))
    );
    scored.push({
      score: hits,
      rec: {
        courseId: toId(course.courseId),
        courseTitle: course.title,
        lessonId: lesson?.lessonId || "",
        lessonTitle: lesson?.title || "",
        chapterTitle: lesson?.chapterTitle || "",
        reason: `${course.title} in the published catalog covers ${skill}.`,
      },
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((item) => item.rec);
};

export const catalogIndex = (catalog = []) => {
  const courses = new Map();
  const lessons = new Map();
  for (const course of catalog) {
    const courseId = toId(course.courseId);
    courses.set(courseId, course);
    for (const lesson of course.lessons || []) {
      lessons.set(`${courseId}:${lesson.lessonId}`, { ...lesson, courseId, courseTitle: course.title });
    }
  }
  return { courses, lessons };
};

export const normalizeSkillGapResult = (raw = {}, catalog = [], evidenceSkills = []) => {
  const { courses, lessons } = catalogIndex(catalog);
  const evidenceNames = [...new Set(
    (Array.isArray(evidenceSkills) ? evidenceSkills : [])
      .map((item) => String(item?.skill || item || "").trim())
      .filter(Boolean)
  )];
  const evidenceLower = new Set(evidenceNames.map((skill) => skill.toLowerCase()));
  const gaps = Array.isArray(raw.gaps) ? raw.gaps : [];
  const normalized = [];

  for (const gap of gaps.slice(0, 12)) {
    const skill = String(gap.skill || gap.missingSkill || "").trim();
    if (!skill) continue;
    if (evidenceLower.has(skill.toLowerCase())) continue;
    const closers = [];
    for (const rec of Array.isArray(gap.recommendedResources) ? gap.recommendedResources : (gap.courses || [])) {
      const courseId = toId(rec.courseId);
      const lessonId = toId(rec.lessonId);
      if (!courses.has(courseId)) continue;
      const course = courses.get(courseId);
      const lessonKey = lessonId ? `${courseId}:${lessonId}` : "";
      const lesson = lessonKey ? lessons.get(lessonKey) : null;
      closers.push({
        courseId,
        courseTitle: course.title,
        lessonId: lesson ? lesson.lessonId : "",
        lessonTitle: lesson ? lesson.title : "",
        chapterTitle: lesson ? lesson.chapterTitle : "",
        reason: String(rec.reason || rec.why || "").trim(),
      });
    }
    if (!closers.length) {
      closers.push(...autoMatchCatalog(skill, catalog));
    }
    if (!closers.length) continue;
    normalized.push({
      skill,
      whyMissing: String(gap.whyMissing || gap.reason || "").trim(),
      evidenceChecked: Array.isArray(gap.evidenceChecked) ? gap.evidenceChecked.map(String).slice(0, 6) : [],
      recommendedResources: closers.slice(0, 4),
    });
  }

  return {
    target: String(raw.target || "").trim(),
    presentSkills: evidenceNames.slice(0, 20),
    gaps: normalized,
  };
};

export const matchGapSkill = (candidate, allowedSkills = []) => {
  const needle = String(candidate || "").trim().toLowerCase();
  if (!needle) return "";
  const exact = allowedSkills.find((skill) => String(skill || "").trim().toLowerCase() === needle);
  if (exact) return exact;
  const partial = allowedSkills.find((skill) => {
    const hay = String(skill || "").trim().toLowerCase();
    return hay && (hay.includes(needle) || needle.includes(hay));
  });
  return partial || "";
};
