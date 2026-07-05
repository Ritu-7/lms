import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import Footer from "../../components/students/Footer";
import Loading from "../../components/students/Loading";

const badgeClasses = {
  not_started: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-blue-100 text-blue-700",
  graded: "bg-emerald-100 text-emerald-700",
  needs_review: "bg-amber-100 text-amber-700",
  expired: "bg-rose-100 text-rose-700",
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

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-12 space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Quizzes</h1>
            <p className="mt-1 text-sm text-gray-500">Timed assessments, instant scoring, and attempt history from your enrolled courses.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="rounded-full bg-white px-3 py-1 border">{totals.available} quizzes</span>
            <span className="rounded-full bg-white px-3 py-1 border">{totals.inProgress} active</span>
            <span className="rounded-full bg-white px-3 py-1 border">{totals.passed} passed</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => {
            const summary = quiz.attemptSummary || {};
            return (
              <div key={quiz._id} className="rounded-2xl border bg-white p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{quiz.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{quiz.course?.courseTitle || "Untitled course"}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[summary.status] || badgeClasses.not_started}`}>{summary.status || "not_started"}</span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3">{quiz.description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs text-gray-500">Passing score</span><span className="font-semibold text-gray-900">{quiz.passingScore}%</span></div>
                  <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs text-gray-500">Time limit</span><span className="font-semibold text-gray-900">{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : "No limit"}</span></div>
                  <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs text-gray-500">Attempts</span><span className="font-semibold text-gray-900">{summary.attemptNumber || 0} / {quiz.attemptLimit || 1}</span></div>
                  <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs text-gray-500">Best score</span><span className="font-semibold text-gray-900">{summary.totalScore || 0} / {summary.maxScore || quiz.totalPoints || 0}</span></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => navigate(`/quiz/${quiz._id}`)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{summary.status === "graded" || summary.status === "submitted" ? "Review Quiz" : "Take Quiz"}</button>
                  {summary.passed ? <span className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">Passed</span> : null}
                  {summary.status === "needs_review" ? <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Needs review</span> : null}
                </div>
              </div>
            );
          })}

          {quizzes.length === 0 ? (
            <div className="col-span-full rounded-2xl border bg-white p-10 text-center text-gray-500 shadow-sm">No quizzes are available yet.</div>
          ) : null}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Quizzes;
