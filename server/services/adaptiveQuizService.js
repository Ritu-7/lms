export const difficultyRank = (question = {}) => {
  const named = String(question.difficulty || "").toLowerCase();
  if (named === "easy") return 1;
  if (named === "medium") return 2;
  if (named === "hard") return 3;
  const points = Number(question.points || 1);
  if (points <= 1) return 1;
  if (points <= 2) return 2;
  return 3;
};

export const difficultyLabel = (question = {}) => {
  const named = String(question.difficulty || "").toLowerCase();
  if (named === "easy" || named === "medium" || named === "hard") return named;
  const rank = difficultyRank(question);
  return rank === 1 ? "easy" : rank === 3 ? "hard" : "medium";
};

export const sanitizeQuizQuestion = (question) => {
  if (!question) return null;
  return {
    questionId: question.questionId,
    prompt: question.prompt,
    questionType: question.questionType,
    points: question.points,
    difficulty: difficultyLabel(question),
    options: (question.options || []).map((option) => ({
      optionId: option.optionId,
      label: option.label,
    })),
  };
};

export const pickAdaptiveNext = (remaining = [], { lastCorrect, lastQuestion, quizTags = [] } = {}) => {
  if (!remaining.length) return null;
  const currentRank = lastQuestion ? difficultyRank(lastQuestion) : 2;
  const target = lastCorrect ? Math.min(3, currentRank + 1) : Math.max(1, currentRank - 1);
  const tokens = new Set(
    [...(quizTags || []), ...(String(lastQuestion?.prompt || "").split(/\W+/))]
      .map((item) => String(item || "").toLowerCase())
      .filter((item) => item.length > 4)
  );
  const scored = remaining.map((item) => {
    const words = String(item.prompt || "").toLowerCase().split(/\W+/);
    const conceptOverlap = words.filter((word) => tokens.has(word)).length;
    const rankDelta = Math.abs(difficultyRank(item) - target);
    return { item, score: rankDelta * 4 + (lastCorrect ? 0 : -conceptOverlap) };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0].item;
};
