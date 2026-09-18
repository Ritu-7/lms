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
  return skills;
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
    if (!closers.length) continue;
    if (evidenceLower.has(skill.toLowerCase())) continue;
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
