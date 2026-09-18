import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Award, CheckCircle2, HelpCircle, PlayCircle, RefreshCw, Timer } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import Footer from "../../components/students/Footer";
import Loading from "../../components/students/Loading";
import ExamPrepPanel from "../../components/students/ai/ExamPrepPanel";

const badgeClasses = {
  not_started: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/30",
  submitted: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/30",
  graded: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30",
  needs_review: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30",
  expired: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30",
};

const Quizzes = () => {
  const navigate = useNavigate();
  const { backendURL, getToken, enrolledCourses, userData } = useContext(AppContext);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/quizzes/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        setQuizzes(Array.isArray(data.quizzes) ? data.quizzes : []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [backendURL, getToken]);

  useEffect(() => {
    if (userData) fetchQuizzes();
  }, [userData, fetchQuizzes, enrolledCourses]);

  const totals = useMemo(() => ({
    available: quizzes.length,
    passed: quizzes.filter((quiz) => quiz.attemptSummary?.passed).length,
    inProgress: quizzes.filter((quiz) => quiz.attemptSummary?.status === "in_progress").length,
  }), [quizzes]);

  const stats = useMemo(() => [
    { label: "Available Quizzes", value: totals.available, icon: HelpCircle, color: "text-blue-600 dark:text-blue-400" },
    { label: "Active Attempts", value: totals.inProgress, icon: Timer, color: "text-amber-600 dark:text-amber-400" },
    { label: "Passed Quizzes", value: totals.passed, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
  ], [totals]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dk-base">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-4">
              <Award size={16} />
              Assessments
            </div>
            <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Quizzes</h1>
            <p className="text-slate-500 dark:text-dk-text-2 mt-2">Timed assessments, instant scoring, and attempt history from your enrolled courses.</p>
          </div>
          <button
            onClick={fetchQuizzes}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 transition-all active:scale-95 shadow-lg shadow-blue-600/25 w-fit"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500 dark:text-dk-text-2">{stat.label}</p>
                  <Icon size={20} className={stat.color} />
                </div>
                <p className={`mt-2 text-3xl font-bold font-space-grotesk ${stat.color}`}>{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        <ExamPrepPanel />

        {/* Quiz Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz, index) => {
            const summary = quiz.attemptSummary || {};
            return (
              <motion.div
                key={quiz._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm flex flex-col justify-between gap-5 hover:shadow-md transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold font-space-grotesk text-slate-900 dark:text-dk-text leading-snug">{quiz.title}</h2>
                      <p className="text-xs font-medium text-slate-500 dark:text-dk-text-2">{quiz.course?.courseTitle || "Untitled course"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClasses[summary.status] || badgeClasses.not_started}`}>
                      {summary.status?.replace("_", " ") || "Not started"}
                    </span>
                  </div>

                  {quiz.description && (
                    <p className="text-sm text-slate-600 dark:text-dk-text-2 line-clamp-3 leading-relaxed">{quiz.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Passing score</span>
                      <span className="font-semibold text-slate-900 dark:text-dk-text">{quiz.passingScore}%</span>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Time limit</span>
                      <span className="font-semibold text-slate-900 dark:text-dk-text">{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : "No limit"}</span>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Attempts</span>
                      <span className="font-semibold text-slate-900 dark:text-dk-text">{summary.attemptNumber || 0} / {quiz.attemptLimit || 1}</span>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Best score</span>
                      <span className="font-semibold text-slate-900 dark:text-dk-text">{summary.totalScore || 0} / {summary.maxScore || quiz.totalPoints || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-dk-border">
                  <button
                    onClick={() => navigate(`/quiz/${quiz._id}`)}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <PlayCircle size={16} />
                    {summary.status === "graded" || summary.status === "submitted" ? "Review Quiz" : "Take Quiz"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/quiz/${quiz._id}?prep=1`)}
                    className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300"
                  >
                    Exam prep
                  </button>
                  {summary.passed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 size={14} />
                      Passed
                    </span>
                  ) : null}
                  {summary.status === "needs_review" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      Needs review
                    </span>
                  ) : null}
                </div>
              </motion.div>
            );
          })}

          {quizzes.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 dark:border-dk-border bg-white dark:bg-dk-surface p-12 text-center shadow-sm">
              <HelpCircle className="mx-auto text-slate-400 dark:text-dk-text-3 mb-3" size={40} />
              <h3 className="text-lg font-bold font-space-grotesk text-slate-900 dark:text-dk-text">No quizzes available</h3>
              <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-1">Quizzes will appear here when added to your enrolled courses.</p>
            </div>
          ) : null}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Quizzes;

