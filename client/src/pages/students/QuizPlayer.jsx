import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import Footer from "../../components/students/Footer";
import Loading from "../../components/students/Loading";

const badgeClasses = {
  graded: "bg-emerald-100 text-emerald-700",
  needs_review: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  expired: "bg-rose-100 text-rose-700",
  in_progress: "bg-cyan-100 text-cyan-700",
};

const QuizPlayer = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { backendURL, getToken, userData } = useContext(AppContext);
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [responses, setResponses] = useState({});
  const [evaluationResponses, setEvaluationResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef(null);

  const fetchQuiz = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        setQuiz(data.quiz);
        setHistory(Array.isArray(data.quiz?.history) ? data.quiz.history : []);
        setEvaluationResponses(Array.isArray(data.quiz?.latestResponses) ? data.quiz.latestResponses : []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      navigate("/quizzes");
    } finally {
      setLoading(false);
    }
  }, [backendURL, getToken, navigate, quizId]);

  const startAttempt = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(`${backendURL}/api/quizzes/${quizId}/start`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        setAttempt(data.attempt);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
    }
  }, [backendURL, getToken, quizId]);

  useEffect(() => {
    if (userData) {
      fetchQuiz();
      startAttempt();
    }
  }, [fetchQuiz, startAttempt, userData]);

  useEffect(() => {
    if (!attempt?.expiresAt) return undefined;
    timerRef.current = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerRef.current);
  }, [attempt?.expiresAt]);

  const timeLeftSeconds = useMemo(() => {
    if (!attempt?.expiresAt) return null;
    return Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - now) / 1000));
  }, [attempt?.expiresAt, now]);

  const minutes = timeLeftSeconds !== null ? Math.floor(timeLeftSeconds / 60) : null;
  const seconds = timeLeftSeconds !== null ? String(timeLeftSeconds % 60).padStart(2, "0") : null;

  const updateSingleResponse = (questionId, field, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { selectedOptions: [], textAnswer: "" }),
        [field]: value,
      },
    }));
  };

  const toggleMultiResponse = (questionId, optionId) => {
    setResponses((prev) => {
      const current = prev[questionId]?.selectedOptions || [];
      const next = current.includes(optionId) ? current.filter((item) => item !== optionId) : [...current, optionId];
      return { ...prev, [questionId]: { ...(prev[questionId] || {}), selectedOptions: next } };
    });
  };

  const submitQuiz = useCallback(async () => {
    try {
      if (!attempt) return;
      setSubmitting(true);
      const token = await getToken();
      const payload = {
        responses: (quiz?.questions || []).map((question) => ({
          questionId: question.questionId,
          selectedOptions: responses[question.questionId]?.selectedOptions || [],
          textAnswer: responses[question.questionId]?.textAnswer || "",
        })),
      };

      const { data } = await axios.post(
        `${backendURL}/api/quizzes/${quizId}/submit`,
        { quizResponse: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Quiz submitted");
        await fetchQuiz();
        setAttempt(data.attempt);
        setEvaluationResponses(Array.isArray(data.responses) ? data.responses : []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  }, [attempt, backendURL, fetchQuiz, getToken, quiz?.questions, quizId, responses]);

  useEffect(() => {
    if (timeLeftSeconds === 0 && attempt?.status === "in_progress" && !submitting) {
      submitQuiz();
    }
  }, [attempt?.status, submitQuiz, submitting, timeLeftSeconds]);

  const activeQuiz = quiz || {};
  const questions = Array.isArray(activeQuiz.questions) ? activeQuiz.questions : [];
  const historySummary = Array.isArray(history) ? history : [];

  if (loading && !quiz) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-12 space-y-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button type="button" onClick={() => navigate("/quizzes")} className="text-sm font-semibold text-blue-600 hover:underline">Back to quizzes</button>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">{activeQuiz.title || "Quiz"}</h1>
            <p className="mt-1 text-sm text-gray-500">{activeQuiz.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white px-3 py-1 border">Pass {activeQuiz.passingScore || 70}%</span>
            <span className="rounded-full bg-white px-3 py-1 border">{activeQuiz.timeLimitMinutes ? `${activeQuiz.timeLimitMinutes} min` : "No timer"}</span>
            <span className="rounded-full bg-white px-3 py-1 border">Attempt {attempt?.attemptNumber || 1} / {activeQuiz.attemptLimit || 1}</span>
            {minutes !== null ? <span className="rounded-full bg-blue-600 px-3 py-1 text-white font-semibold">{minutes}:{seconds}</span> : null}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {attempt?.status === "graded" || attempt?.status === "needs_review" || attempt?.status === "expired" ? (
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Result</h2>
                    <p className="text-sm text-gray-500">Your latest attempt has been scored.</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[attempt.status] || badgeClasses.submitted}`}>{attempt.status}</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-gray-600">
                  <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs text-gray-500">Score</span><span className="font-semibold text-gray-900">{attempt.totalScore || 0} / {attempt.maxScore || activeQuiz.totalPoints || 0}</span></div>
                  <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs text-gray-500">Percentage</span><span className="font-semibold text-gray-900">{attempt.percentage || 0}%</span></div>
                  <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs text-gray-500">Passed</span><span className="font-semibold text-gray-900">{attempt.passed ? "Yes" : "No"}</span></div>
                </div>
                {activeQuiz.reviewMode ? (
                  <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-800">Review mode</p>
                    <p className="mt-1">{activeQuiz.showCorrectAnswersImmediately ? "Correct answers are visible below." : "Your instructor enabled review mode for this quiz."}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Quiz questions</h2>
                  <p className="text-sm text-gray-500">Answer each item, then submit before the timer expires.</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[attempt?.status] || badgeClasses.in_progress}`}>{attempt?.status || "in_progress"}</span>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => {
                  const response = responses[question.questionId] || { selectedOptions: [], textAnswer: "" };
                  const attemptResponse = attempt?.responses?.find((item) => item.questionId === question.questionId);
                  const isReadOnly = attempt?.status === "graded" || attempt?.status === "needs_review" || attempt?.status === "expired";

                  return (
                    <div key={question.questionId} className="rounded-xl border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Question {index + 1}</p>
                          <h3 className="mt-1 text-base font-semibold text-gray-900">{question.prompt}</h3>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{question.points || 1} pts</span>
                      </div>

                      {question.questionType === "mcq" || question.questionType === "true_false" ? (
                        <div className="space-y-2">
                          {(question.options || []).map((option) => (
                            <label key={option.optionId} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${isReadOnly ? "bg-gray-50" : "hover:bg-gray-50"}`}>
                              <input
                                type="radio"
                                name={question.questionId}
                                value={option.optionId}
                                disabled={isReadOnly}
                                checked={response.selectedOptions?.[0] === option.optionId}
                                onChange={() => updateSingleResponse(question.questionId, "selectedOptions", [option.optionId])}
                              />
                              <span className="text-sm text-gray-700">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}

                      {question.questionType === "multiple_select" ? (
                        <div className="space-y-2">
                          {(question.options || []).map((option) => (
                            <label key={option.optionId} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${isReadOnly ? "bg-gray-50" : "hover:bg-gray-50"}`}>
                              <input
                                type="checkbox"
                                disabled={isReadOnly}
                                checked={(response.selectedOptions || []).includes(option.optionId)}
                                onChange={() => toggleMultiResponse(question.questionId, option.optionId)}
                              />
                              <span className="text-sm text-gray-700">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}

                      {question.questionType === "short_answer" ? (
                        <textarea
                          rows="3"
                          value={response.textAnswer || ""}
                          disabled={isReadOnly}
                          onChange={(e) => updateSingleResponse(question.questionId, "textAnswer", e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                          placeholder="Type your answer"
                        />
                      ) : null}

                      {(attemptResponse || evaluationResponses.find((item) => item.questionId === question.questionId)) && activeQuiz.reviewMode ? (
                        (() => {
                          const evaluated = attemptResponse || evaluationResponses.find((item) => item.questionId === question.questionId);
                          return (
                        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                          <p className="font-semibold text-gray-800">Review</p>
                          <p className="mt-1">{evaluated.feedback || (evaluated.isCorrect ? "Correct" : "Incorrect")}</p>
                          {evaluated.explanation ? <p className="mt-1 text-gray-500">{evaluated.explanation}</p> : null}
                        </div>
                          );
                        })()
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={!attempt || submitting || attempt?.status === "graded" || attempt?.status === "needs_review" || attempt?.status === "expired"}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : attempt?.status === "graded" ? "Submitted" : "Submit Quiz"}
                </button>
                <button type="button" onClick={() => navigate("/quizzes")} className="rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700">Back to quizzes</button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Quiz history</h2>
              <div className="mt-4 space-y-3">
                {historySummary.length > 0 ? historySummary.map((item, index) => (
                  <div key={`${item.attemptNumber}-${index}`} className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-600">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900">Attempt {item.attemptNumber}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClasses[item.status] || badgeClasses.not_started}`}>{item.status}</span>
                    </div>
                    <p className="mt-1">{item.totalScore || 0} / {item.maxScore || activeQuiz.totalPoints || 0} • {item.percentage || 0}%</p>
                    <p>{item.passed ? "Passed" : "Not passed"}</p>
                    <p>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "In progress"}</p>
                  </div>
                )) : <p className="text-sm text-gray-500">No past attempts yet.</p>}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-2 text-sm text-gray-600">
              <h2 className="text-lg font-semibold text-gray-900">Quiz info</h2>
              <p><span className="font-semibold text-gray-800">Attempts allowed:</span> {activeQuiz.attemptLimit || 1}</p>
              <p><span className="font-semibold text-gray-800">Passing score:</span> {activeQuiz.passingScore || 70}%</p>
              <p><span className="font-semibold text-gray-800">Timer:</span> {activeQuiz.timeLimitMinutes ? `${activeQuiz.timeLimitMinutes} minutes` : "No timer"}</p>
              <p><span className="font-semibold text-gray-800">Review mode:</span> {activeQuiz.reviewMode ? "Enabled" : "Disabled"}</p>
              <p><span className="font-semibold text-gray-800">Instant evaluation:</span> {activeQuiz.instantEvaluation ? "Enabled" : "Disabled"}</p>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default QuizPlayer;
