export const assignmentStatusLabels = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
  not_submitted: "Not submitted",
  submitted: "Submitted",
  late_submitted: "Late submission",
  needs_resubmission: "Needs resubmission",
  graded: "Graded",
  returned: "Returned",
};

export const normalizeAssignmentRubric = (rubric = []) =>
  (Array.isArray(rubric) ? rubric : []).map((item, index) => ({
    rubricId: item.rubricId || item.id || `${index + 1}`,
    title: item.title || item.label || `Criterion ${index + 1}`,
    description: item.description || "",
    maxScore: Number(item.maxScore || 0),
    order: Number(item.order || index + 1),
  }));

export const normalizeAssignmentAttachments = (attachments = []) => Array.isArray(attachments) ? attachments : [];

export const isSubmissionLate = (assignment = {}, submittedAt = new Date()) => {
  if (!assignment?.dueDate) return false;
  return new Date(submittedAt).getTime() > new Date(assignment.dueDate).getTime();
};

export const deriveSubmissionStatus = ({ assignment = {}, isLate = false, needsResubmission = false, graded = false } = {}) => {
  if (graded) return "graded";
  if (needsResubmission) return "needs_resubmission";
  if (isLate) return "late_submitted";
  return "submitted";
};

export const calculateRubricTotals = (rubricScores = []) => {
  const safeScores = Array.isArray(rubricScores) ? rubricScores : [];
  const totalScore = safeScores.reduce((sum, item) => sum + Number(item.score || 0), 0);
  const maxScore = safeScores.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
  return { totalScore, maxScore };
};

export const calculateLatePenalty = (assignment = {}, isLate = false) => {
  if (!isLate) return 0;
  return Math.max(0, Math.min(100, Number(assignment.latePenaltyPercent || 0)));
};

export const computeAttemptSnapshot = ({
  attemptNumber = 1,
  submittedAt = new Date(),
  textResponse = "",
  attachments = [],
  rubricScores = [],
  assignment = {},
  graded = false,
  needsResubmission = false,
  feedback = "",
  gradeLabel = "",
  reviewedBy = null,
  reviewedAt = null,
} = {}) => {
  const isLate = isSubmissionLate(assignment, submittedAt);
  const derivedStatus = deriveSubmissionStatus({ assignment, isLate, needsResubmission, graded });
  const totals = calculateRubricTotals(rubricScores);
  const latePenaltyApplied = calculateLatePenalty(assignment, isLate);
  const adjustedScore = totals.maxScore > 0 ? Math.max(0, totals.totalScore - (totals.totalScore * latePenaltyApplied) / 100) : totals.totalScore;

  return {
    attemptNumber,
    submittedAt,
    isLate,
    textResponse,
    attachments,
    status: derivedStatus,
    totalScore: adjustedScore,
    maxScore: totals.maxScore,
    gradeLabel,
    feedback,
    rubricScores,
    reviewedBy,
    reviewedAt,
    latePenaltyApplied,
  };
};

export const canResubmitAssignment = (assignment = {}, submission = null) => {
  if (!assignment) return false;
  if (assignment.status !== "published") return false;
  if (!assignment.maxAttempts || assignment.maxAttempts < 1) return true;
  const attempts = submission?.attemptCount || submission?.attempts?.length || 0;
  return attempts < assignment.maxAttempts;
};

export const summarizeAssignmentSubmission = (submission = null) => {
  if (!submission) {
    return {
      status: "not_submitted",
      attempts: 0,
      isLate: false,
      totalScore: 0,
      maxScore: 0,
      gradeLabel: "",
      feedback: "",
      latestAttempt: null,
    };
  }

  return {
    status: submission.status,
    attempts: submission.attemptCount || submission.attempts?.length || 0,
    isLate: Boolean(submission.isLate),
    totalScore: Number(submission.totalScore || 0),
    maxScore: Number(submission.maxScore || 0),
    gradeLabel: submission.gradeLabel || "",
    feedback: submission.feedback || "",
    latestAttempt: submission.latestAttempt || null,
    submittedAt: submission.submittedAt || submission.latestAttempt?.submittedAt || null,
    reviewedAt: submission.reviewedAt || submission.latestAttempt?.reviewedAt || null,
  };
};
