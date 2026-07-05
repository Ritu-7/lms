export const quizQuestionTypes = ["mcq", "multiple_select", "true_false", "short_answer"];

export const normalizeQuizQuestions = (questions = []) =>
  (Array.isArray(questions) ? questions : []).map((question, index) => ({
    questionId: question.questionId || question.id || `${index + 1}`,
    prompt: question.prompt || question.question || `Question ${index + 1}`,
    questionType: quizQuestionTypes.includes(question.questionType) ? question.questionType : "mcq",
    options: Array.isArray(question.options)
      ? question.options.map((option, optionIndex) => ({
          optionId: option.optionId || option.id || `${index + 1}-${optionIndex + 1}`,
          label: option.label || option.text || `Option ${optionIndex + 1}`,
          isCorrect: Boolean(option.isCorrect),
        }))
      : [],
    correctAnswer: question.correctAnswer ?? null,
    acceptableAnswers: Array.isArray(question.acceptableAnswers) ? question.acceptableAnswers.filter(Boolean) : [],
    explanation: question.explanation || "",
    points: Number(question.points || 1),
    shuffleOptions: Boolean(question.shuffleOptions),
    allowPartialCredit: Boolean(question.allowPartialCredit),
    caseSensitive: Boolean(question.caseSensitive),
    order: Number(question.order || index + 1),
  }));

export const calculateQuizTotalPoints = (questions = []) =>
  normalizeQuizQuestions(questions).reduce((sum, question) => sum + Number(question.points || 0), 0);

export const quizStatusLabel = (status = "draft") => {
  const labels = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
    in_progress: "In Progress",
    submitted: "Submitted",
    graded: "Graded",
    needs_review: "Needs Review",
    expired: "Expired",
  };
  return labels[status] || status;
};

const normalizeText = (value = "", caseSensitive = false) => {
  const text = String(value ?? "").trim();
  return caseSensitive ? text : text.toLowerCase();
};

const arraysEqualAsSets = (left = [], right = []) => {
  const leftSet = new Set(left.map(String));
  const rightSet = new Set(right.map(String));
  if (leftSet.size !== rightSet.size) return false;
  for (const item of leftSet) {
    if (!rightSet.has(item)) return false;
  }
  return true;
};

export const evaluateQuizQuestion = (question = {}, response = {}) => {
  const questionType = question.questionType || "mcq";
  const maxScore = Number(question.points || 0);
  const selectedOptions = Array.isArray(response.selectedOptions) ? response.selectedOptions.filter(Boolean).map(String) : [];
  const textAnswer = String(response.textAnswer || "");

  if (questionType === "mcq") {
    const correctOption = (question.options || []).find((option) => option.isCorrect);
    const isCorrect = correctOption ? selectedOptions[0] === correctOption.optionId : false;
    return {
      isCorrect,
      scoreAwarded: isCorrect ? maxScore : 0,
      correctAnswer: correctOption?.optionId || null,
      explanation: question.explanation || "",
      feedback: isCorrect ? "Correct" : "Incorrect",
    };
  }

  if (questionType === "multiple_select") {
    const correctOptionIds = (question.options || []).filter((option) => option.isCorrect).map((option) => option.optionId);
    const isCorrect = arraysEqualAsSets(selectedOptions, correctOptionIds);
    const partialCredit = question.allowPartialCredit && correctOptionIds.length > 0
      ? selectedOptions.filter((optionId) => correctOptionIds.includes(optionId)).length / correctOptionIds.length
      : 0;
    return {
      isCorrect,
      scoreAwarded: isCorrect ? maxScore : Math.round(maxScore * partialCredit),
      correctAnswer: correctOptionIds,
      explanation: question.explanation || "",
      feedback: isCorrect ? "Correct" : partialCredit > 0 ? "Partially correct" : "Incorrect",
    };
  }

  if (questionType === "true_false") {
    const correctValue = Boolean(question.correctAnswer ?? (question.options || []).find((option) => option.isCorrect)?.optionId === "true");
    const submittedValue = selectedOptions[0] === "true" || textAnswer.toLowerCase() === "true";
    const isCorrect = submittedValue === correctValue;
    return {
      isCorrect,
      scoreAwarded: isCorrect ? maxScore : 0,
      correctAnswer: correctValue,
      explanation: question.explanation || "",
      feedback: isCorrect ? "Correct" : "Incorrect",
    };
  }

  const acceptableAnswers = [
    ...(Array.isArray(question.acceptableAnswers) ? question.acceptableAnswers : []),
    ...(question.correctAnswer ? [question.correctAnswer] : []),
  ]
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
    .map((value) => normalizeText(value, question.caseSensitive));
  const normalizedAnswer = normalizeText(textAnswer, question.caseSensitive);
  const isCorrect = acceptableAnswers.some((answer) => answer === normalizedAnswer || answer.includes(normalizedAnswer) || normalizedAnswer.includes(answer));

  return {
    isCorrect,
    scoreAwarded: isCorrect ? maxScore : 0,
    correctAnswer: question.correctAnswer ?? question.acceptableAnswers ?? null,
    explanation: question.explanation || "",
    feedback: isCorrect ? "Correct" : "Requires review",
    needsReview: !isCorrect && acceptableAnswers.length === 0,
  };
};

export const evaluateQuizAttempt = ({ quiz = {}, responses = [] } = {}) => {
  const questions = normalizeQuizQuestions(quiz.questions || []);
  const responseMap = new Map((Array.isArray(responses) ? responses : []).map((response) => [String(response.questionId), response]));

  const evaluatedResponses = questions.map((question) => {
    const evaluation = evaluateQuizQuestion(question, responseMap.get(String(question.questionId)) || {});
    return {
      questionId: question.questionId,
      questionType: question.questionType,
      selectedOptions: Array.isArray(responseMap.get(String(question.questionId))?.selectedOptions)
        ? responseMap.get(String(question.questionId)).selectedOptions.map(String)
        : [],
      textAnswer: String(responseMap.get(String(question.questionId))?.textAnswer || ""),
      isCorrect: Boolean(evaluation.isCorrect),
      scoreAwarded: Number(evaluation.scoreAwarded || 0),
      maxScore: Number(question.points || 0),
      feedback: evaluation.feedback || "",
      correctAnswer: evaluation.correctAnswer,
      explanation: evaluation.explanation || "",
    };
  });

  const totalScore = evaluatedResponses.reduce((sum, response) => sum + Number(response.scoreAwarded || 0), 0);
  const maxScore = questions.reduce((sum, question) => sum + Number(question.points || 0), 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const needsReview = evaluatedResponses.some((response) => response.feedback === "Requires review");

  return {
    evaluatedResponses,
    totalScore,
    maxScore,
    percentage,
    needsReview,
    passed: percentage >= Number(quiz.passingScore || 70),
  };
};

export const computeQuizExpiresAt = (startedAt = new Date(), timeLimitMinutes = 0) => {
  const timeLimit = Number(timeLimitMinutes || 0);
  if (!timeLimit) return null;
  return new Date(new Date(startedAt).getTime() + timeLimit * 60 * 1000);
};

export const canAttemptQuiz = (quiz = {}, attemptCount = 0) => {
  if (quiz.status !== "published") return false;
  const limit = Number(quiz.attemptLimit || 1);
  return attemptCount < limit;
};

export const summarizeQuizAttempt = (attempt = null) => {
  if (!attempt) {
    return {
      status: "not_started",
      attemptNumber: 0,
      totalScore: 0,
      maxScore: 0,
      percentage: 0,
      passed: false,
      submittedAt: null,
      startedAt: null,
      expiresAt: null,
      timeSpentSeconds: 0,
      responses: [],
    };
  }

  return {
    status: attempt.status,
    attemptNumber: attempt.attemptNumber || 0,
    totalScore: Number(attempt.totalScore || 0),
    maxScore: Number(attempt.maxScore || 0),
    percentage: Number(attempt.percentage || 0),
    passed: Boolean(attempt.passed),
    submittedAt: attempt.submittedAt || null,
    startedAt: attempt.startedAt || null,
    expiresAt: attempt.expiresAt || null,
    timeSpentSeconds: Number(attempt.timeSpentSeconds || 0),
    responses: attempt.responses || [],
  };
};
