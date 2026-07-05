import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/students/Loading";

const questionTypes = [
  { value: "mcq", label: "MCQ" },
  { value: "multiple_select", label: "Multiple Select" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short Answer" },
];

const emptyOption = (index = 1) => ({ optionId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${index}`, label: "", isCorrect: false });
const emptyQuestion = (index = 1) => ({
  questionId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${index}`,
  prompt: "",
  questionType: "mcq",
  options: [emptyOption(1), emptyOption(2), emptyOption(3), emptyOption(4)],
  correctAnswer: "",
  acceptableAnswers: "",
  explanation: "",
  points: 1,
  shuffleOptions: false,
  allowPartialCredit: false,
  caseSensitive: false,
});

const badgeClasses = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-slate-100 text-slate-700",
  graded: "bg-emerald-100 text-emerald-700",
  needs_review: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  expired: "bg-rose-100 text-rose-700",
};

const toPayloadQuestions = (questions = []) =>
  questions.map((question, index) => ({
    questionId: question.questionId,
    prompt: question.prompt,
    questionType: question.questionType,
    options:
      question.questionType === "short_answer"
        ? []
        : question.options.map((option, optionIndex) => ({
            optionId: option.optionId || `${index + 1}-${optionIndex + 1}`,
            label: option.label,
            isCorrect: Boolean(option.isCorrect),
          })),
    correctAnswer: question.questionType === "short_answer" ? question.correctAnswer || "" : question.correctAnswer || null,
    acceptableAnswers:
      question.questionType === "short_answer"
        ? String(question.acceptableAnswers || "")
            .split("\n")
            .map((answer) => answer.trim())
            .filter(Boolean)
        : [],
    explanation: question.explanation || "",
    points: Number(question.points || 1),
    shuffleOptions: Boolean(question.shuffleOptions),
    allowPartialCredit: Boolean(question.allowPartialCredit),
    caseSensitive: Boolean(question.caseSensitive),
    order: index + 1,
  }));

const hydrateQuestion = (question = {}) => ({
  questionId: question.questionId,
  prompt: question.prompt || "",
  questionType: question.questionType || "mcq",
  options:
    Array.isArray(question.options) && question.options.length > 0
      ? question.options.map((option) => ({ optionId: option.optionId, label: option.label, isCorrect: Boolean(option.isCorrect) }))
      : [emptyOption(1), emptyOption(2), emptyOption(3), emptyOption(4)],
  correctAnswer: question.correctAnswer || "",
  acceptableAnswers: Array.isArray(question.acceptableAnswers) ? question.acceptableAnswers.join("\n") : "",
  explanation: question.explanation || "",
  points: Number(question.points || 1),
  shuffleOptions: Boolean(question.shuffleOptions),
  allowPartialCredit: Boolean(question.allowPartialCredit),
  caseSensitive: Boolean(question.caseSensitive),
});

const buildDraft = () => ({
  title: "",
  description: "",
  instructions: "",
  course: "",
  module: "",
  lesson: "",
  status: "draft",
  startAt: "",
  dueAt: "",
  timeLimitMinutes: 15,
  attemptLimit: 1,
  passingScore: 70,
  instantEvaluation: true,
  reviewMode: true,
  showCorrectAnswersImmediately: false,
  shuffleQuestions: false,
  tags: "",
  questions: [emptyQuestion()],
});

const Quizzes = () => {
  const { backendURL, getToken } = useContext(AppContext);
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [draft, setDraft] = useState(buildDraft());
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({ totalScore: "", maxScore: "", passed: true, status: "graded" });

  const fetchCourses = useCallback(async () => {
    const token = await getToken();
    const { data } = await axios.get(`${backendURL}/api/educator/courses`, { headers: { Authorization: `Bearer ${token}` } });
    if (data.success) setCourses(Array.isArray(data.courses) ? data.courses : []);
  }, [backendURL, getToken]);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/quizzes/educator/list`, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        const list = Array.isArray(data.quizzes) ? data.quizzes : [];
        setQuizzes(list);
        if (!selectedQuizId && list.length) setSelectedQuizId(list[0]._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [backendURL, getToken, selectedQuizId]);

  const fetchAttempts = useCallback(async (quizId) => {
    if (!quizId) return;
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/quizzes/educator/${quizId}/attempts`, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) setAttempts(Array.isArray(data.attempts) ? data.attempts : []);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backendURL, getToken]);

  useEffect(() => {
    fetchCourses();
    fetchQuizzes();
  }, [fetchCourses, fetchQuizzes]);

  useEffect(() => {
    fetchAttempts(selectedQuizId);
  }, [fetchAttempts, selectedQuizId]);

  const selectedQuiz = useMemo(() => quizzes.find((quiz) => quiz._id === selectedQuizId) || null, [quizzes, selectedQuizId]);

  const resetForm = () => {
    setDraft(buildDraft());
    setEditingId("");
  };

  const selectQuiz = (quiz) => {
    setSelectedQuizId(quiz._id);
    setReviewDraft({ totalScore: quiz.totalPoints || 0, maxScore: quiz.totalPoints || 0, passed: true, status: "graded" });
  };

  const editQuiz = (quiz) => {
    setEditingId(quiz._id);
    setDraft({
      title: quiz.title || "",
      description: quiz.description || "",
      instructions: quiz.instructions || "",
      course: quiz.course?._id || quiz.course || "",
      module: quiz.module || "",
      lesson: quiz.lesson || "",
      status: quiz.status || "draft",
      startAt: quiz.startAt ? new Date(quiz.startAt).toISOString().slice(0, 16) : "",
      dueAt: quiz.dueAt ? new Date(quiz.dueAt).toISOString().slice(0, 16) : "",
      timeLimitMinutes: Number(quiz.timeLimitMinutes || 0),
      attemptLimit: Number(quiz.attemptLimit || 1),
      passingScore: Number(quiz.passingScore || 70),
      instantEvaluation: Boolean(quiz.instantEvaluation),
      reviewMode: Boolean(quiz.reviewMode),
      showCorrectAnswersImmediately: Boolean(quiz.showCorrectAnswersImmediately),
      shuffleQuestions: Boolean(quiz.shuffleQuestions),
      tags: Array.isArray(quiz.tags) ? quiz.tags.join(", ") : "",
      questions: Array.isArray(quiz.questions) && quiz.questions.length > 0 ? quiz.questions.map(hydrateQuestion) : [emptyQuestion()],
    });
  };

  const updateQuestion = (index, key, value) => {
    setDraft((prev) => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], [key]: value };
      return { ...prev, questions };
    });
  };

  const addQuestion = () => setDraft((prev) => ({ ...prev, questions: [...prev.questions, emptyQuestion(prev.questions.length + 1)] }));
  const removeQuestion = (index) => setDraft((prev) => ({ ...prev, questions: prev.questions.filter((_, questionIndex) => questionIndex !== index) }));

  const updateOption = (questionIndex, optionIndex, key, value) => {
    setDraft((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[questionIndex].options];
      options[optionIndex] = { ...options[optionIndex], [key]: value };
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
  };

  const addOption = (questionIndex) => {
    setDraft((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex] = { ...questions[questionIndex], options: [...questions[questionIndex].options, emptyOption(questions[questionIndex].options.length + 1)] };
      return { ...prev, questions };
    });
  };

  const removeOption = (questionIndex, optionIndex) => {
    setDraft((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex] = { ...questions[questionIndex], options: questions[questionIndex].options.filter((_, index) => index !== optionIndex) };
      return { ...prev, questions };
    });
  };

  const saveQuiz = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const token = await getToken();
      const payload = {
        ...draft,
        course: draft.course,
        startAt: draft.startAt,
        dueAt: draft.dueAt,
        timeLimitMinutes: Number(draft.timeLimitMinutes || 0),
        attemptLimit: Number(draft.attemptLimit || 1),
        passingScore: Number(draft.passingScore || 70),
        questions: toPayloadQuestions(draft.questions),
      };

      const { data } = editingId
        ? await axios.put(`${backendURL}/api/quizzes/educator/${editingId}`, { quizData: payload }, { headers: { Authorization: `Bearer ${token}` } })
        : await axios.post(`${backendURL}/api/quizzes/educator`, { quizData: payload }, { headers: { Authorization: `Bearer ${token}` } });

      if (data.success) {
        toast.success(editingId ? "Quiz updated" : "Quiz created");
        resetForm();
        await fetchQuizzes();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm("Delete this quiz and all attempts?")) return;
    try {
      const token = await getToken();
      const { data } = await axios.delete(`${backendURL}/api/quizzes/educator/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success(data.message);
        await fetchQuizzes();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const reviewAttempt = async (attemptId) => {
    try {
      const token = await getToken();
      const { data } = await axios.patch(
        `${backendURL}/api/quizzes/educator/attempts/${attemptId}/review`,
        { reviewData: reviewDraft },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Attempt reviewed");
        await fetchAttempts(selectedQuizId);
        await fetchQuizzes();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  if (loading && !quizzes.length) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 md:p-8 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Quizzes</h1>
          <p className="mt-1 text-sm text-gray-500">Build timed quizzes, score objective questions instantly, and review attempts.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white px-3 py-1 border">{quizzes.length} quizzes</span>
          <span className="rounded-full bg-white px-3 py-1 border">{attempts.length} attempts</span>
          <button onClick={resetForm} className="rounded-full bg-blue-600 px-4 py-1.5 text-white font-medium">New Quiz</button>
        </div>
      </div>

      <form onSubmit={saveQuiz} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{editingId ? "Edit quiz" : "Create quiz"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Title</span>
              <input required value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea rows="3" value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Instructions</span>
              <textarea rows="4" value={draft.instructions} onChange={(e) => setDraft((prev) => ({ ...prev, instructions: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Course</span>
              <select required value={draft.course} onChange={(e) => setDraft((prev) => ({ ...prev, course: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500">
                <option value="">Select course</option>
                {courses.map((course) => <option key={course._id} value={course._id}>{course.courseTitle}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select value={draft.status} onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Start at</span>
              <input type="datetime-local" value={draft.startAt} onChange={(e) => setDraft((prev) => ({ ...prev, startAt: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Due at</span>
              <input type="datetime-local" value={draft.dueAt} onChange={(e) => setDraft((prev) => ({ ...prev, dueAt: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Time limit (minutes)</span>
              <input type="number" min="0" value={draft.timeLimitMinutes} onChange={(e) => setDraft((prev) => ({ ...prev, timeLimitMinutes: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Attempt limit</span>
              <input type="number" min="1" value={draft.attemptLimit} onChange={(e) => setDraft((prev) => ({ ...prev, attemptLimit: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Passing score</span>
              <input type="number" min="0" max="100" value={draft.passingScore} onChange={(e) => setDraft((prev) => ({ ...prev, passingScore: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Tags</span>
              <input value={draft.tags} onChange={(e) => setDraft((prev) => ({ ...prev, tags: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" placeholder="math, js, basics" />
            </label>
            <div className="flex flex-wrap gap-4 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={draft.instantEvaluation} onChange={(e) => setDraft((prev) => ({ ...prev, instantEvaluation: e.target.checked }))} />Instant evaluation</label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={draft.reviewMode} onChange={(e) => setDraft((prev) => ({ ...prev, reviewMode: e.target.checked }))} />Review mode</label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={draft.showCorrectAnswersImmediately} onChange={(e) => setDraft((prev) => ({ ...prev, showCorrectAnswersImmediately: e.target.checked }))} />Show answers immediately</label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={draft.shuffleQuestions} onChange={(e) => setDraft((prev) => ({ ...prev, shuffleQuestions: e.target.checked }))} />Shuffle questions</label>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-800">Questions</h3>
              <button type="button" onClick={addQuestion} className="text-sm font-semibold text-blue-600">Add question</button>
            </div>

            {draft.questions.map((question, questionIndex) => (
              <div key={question.questionId || questionIndex} className="rounded-xl border bg-white p-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
                  <input value={question.prompt} onChange={(e) => updateQuestion(questionIndex, "prompt", e.target.value)} placeholder={`Question ${questionIndex + 1}`} className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500 md:col-span-1" />
                  <select value={question.questionType} onChange={(e) => updateQuestion(questionIndex, "questionType", e.target.value)} className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500">
                    {questionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <input type="number" min="0" value={question.points} onChange={(e) => updateQuestion(questionIndex, "points", e.target.value)} className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500" placeholder="Points" />
                </div>

                {question.questionType === "short_answer" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <textarea rows="3" value={question.correctAnswer} onChange={(e) => updateQuestion(questionIndex, "correctAnswer", e.target.value)} className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500" placeholder="Preferred answer" />
                    <textarea rows="3" value={question.acceptableAnswers} onChange={(e) => updateQuestion(questionIndex, "acceptableAnswers", e.target.value)} className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500" placeholder="Acceptable answers, one per line" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={option.optionId || optionIndex} className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                        <input value={option.label} onChange={(e) => updateOption(questionIndex, optionIndex, "label", e.target.value)} placeholder={`Option ${optionIndex + 1}`} className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600"><input type="checkbox" checked={option.isCorrect} onChange={(e) => updateOption(questionIndex, optionIndex, "isCorrect", e.target.checked)} />Correct</label>
                        <button type="button" onClick={() => removeOption(questionIndex, optionIndex)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(questionIndex)} className="text-sm font-semibold text-blue-600">Add option</button>
                  </div>
                )}

                <textarea rows="2" value={question.explanation} onChange={(e) => updateQuestion(questionIndex, "explanation", e.target.value)} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" placeholder="Explanation / review feedback" />

                <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={question.shuffleOptions} onChange={(e) => updateQuestion(questionIndex, "shuffleOptions", e.target.checked)} />Shuffle options</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={question.allowPartialCredit} onChange={(e) => updateQuestion(questionIndex, "allowPartialCredit", e.target.checked)} />Partial credit</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={question.caseSensitive} onChange={(e) => updateQuestion(questionIndex, "caseSensitive", e.target.checked)} />Case sensitive</label>
                  <button type="button" onClick={() => removeQuestion(questionIndex)} className="text-sm font-semibold text-red-600">Remove question</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            {editingId ? <button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700">Cancel</button> : null}
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : editingId ? "Update Quiz" : "Create Quiz"}</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Quiz details</h2>
            {selectedQuiz ? (
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p className="text-base font-semibold text-gray-900">{selectedQuiz.title}</p>
                <p>{selectedQuiz.description}</p>
                <p><span className="font-medium text-gray-800">Course:</span> {selectedQuiz.course?.courseTitle || "Untitled"}</p>
                <p><span className="font-medium text-gray-800">Status:</span> <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClasses[selectedQuiz.status] || badgeClasses.draft}`}>{selectedQuiz.status}</span></p>
                <p><span className="font-medium text-gray-800">Attempts:</span> {selectedQuiz.stats?.attempts || 0}</p>
                <p><span className="font-medium text-gray-800">Passes:</span> {selectedQuiz.stats?.passed || 0}</p>
                <p><span className="font-medium text-gray-800">Passing score:</span> {selectedQuiz.passingScore}%</p>
                <p><span className="font-medium text-gray-800">Time limit:</span> {selectedQuiz.timeLimitMinutes ? `${selectedQuiz.timeLimitMinutes} minutes` : "No limit"}</p>
              </div>
            ) : <p className="mt-3 text-sm text-gray-500">Select a quiz to review attempts.</p>}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Attempts</h2>
            <div className="mt-4 space-y-3">
              {attempts.length > 0 ? attempts.map((attempt) => (
                <div key={attempt._id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{attempt.student?.name || attempt.student?.email || "Student"}</p>
                      <p className="text-xs text-gray-500">Attempt {attempt.summary?.attemptNumber || 0} • {attempt.summary?.submittedAt ? new Date(attempt.summary.submittedAt).toLocaleString() : "In progress"}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[attempt.summary?.status] || badgeClasses.submitted}`}>{attempt.summary?.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">Score: {attempt.summary?.totalScore || 0} / {attempt.summary?.maxScore || 0} ({attempt.summary?.percentage || 0}%)</p>
                  <p className="text-sm text-gray-600">Passed: {attempt.summary?.passed ? "Yes" : "No"}</p>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input type="number" value={reviewDraft.totalScore} onChange={(e) => setReviewDraft((prev) => ({ ...prev, totalScore: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Total score" />
                    <input type="number" value={reviewDraft.maxScore} onChange={(e) => setReviewDraft((prev) => ({ ...prev, maxScore: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Max score" />
                    <select value={reviewDraft.status} onChange={(e) => setReviewDraft((prev) => ({ ...prev, status: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500">
                      <option value="graded">Graded</option>
                      <option value="needs_review">Needs review</option>
                      <option value="submitted">Submitted</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={reviewDraft.passed} onChange={(e) => setReviewDraft((prev) => ({ ...prev, passed: e.target.checked }))} />Passed</label>
                  <button type="button" onClick={() => reviewAttempt(attempt._id)} className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white">Save Review</button>
                </div>
              )) : <p className="text-sm text-gray-500">No attempts yet.</p>}
            </div>
          </div>
        </div>
      </form>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Quiz</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {quizzes.map((quiz) => (
              <tr key={quiz._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => selectQuiz(quiz)} className="font-medium text-gray-900 hover:underline">{quiz.title}</button>
                  <div className="text-xs text-gray-500">{quiz.questions?.length || 0} questions</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{quiz.course?.courseTitle || "Untitled"}</td>
                <td className="px-4 py-3 text-gray-600">{quiz.dueAt ? new Date(quiz.dueAt).toLocaleDateString() : "N/A"}</td>
                <td className="px-4 py-3 text-gray-600">{quiz.stats?.attempts || 0}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[quiz.status] || badgeClasses.draft}`}>{quiz.status}</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button type="button" onClick={() => editQuiz(quiz)} className="text-blue-600 font-medium hover:underline">Edit</button>
                  <button type="button" onClick={() => deleteQuiz(quiz._id)} className="text-red-600 font-medium hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {quizzes.length === 0 ? <tr><td colSpan="6" className="px-4 py-10 text-center text-gray-500">No quizzes created yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Quizzes;
