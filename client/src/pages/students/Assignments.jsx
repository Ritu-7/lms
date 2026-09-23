import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { AlertCircle, BookOpen, CheckCircle2, FileEdit, FileText, Paperclip, RefreshCw, Send } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import Footer from "../../components/students/Footer";
import Loading from "../../components/students/Loading";
import Button from "../../components/ui/Button";

const badgeClasses = {
  not_submitted: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  submitted: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/30",
  late_submitted: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30",
  needs_resubmission: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30",
  graded: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30",
  returned: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-500/30",
};

const Assignments = () => {
  const { backendURL, getToken, enrolledCourses } = useContext(AppContext);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responseText, setResponseText] = useState("");

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/assignments/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        const list = Array.isArray(data.assignments) ? data.assignments : [];
        setAssignments(list);
        if (!selectedAssignmentId && list.length) setSelectedAssignmentId(list[0]._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [backendURL, getToken, selectedAssignmentId]);

  useEffect(() => {
    if (enrolledCourses?.length) fetchAssignments();
  }, [enrolledCourses, fetchAssignments]);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment._id === selectedAssignmentId) || null,
    [assignments, selectedAssignmentId]
  );

  const stats = useMemo(() => {
    const resubmissionsCount = assignments.filter((a) => a.submission?.status === "needs_resubmission").length;
    const gradedCount = assignments.filter((a) => a.submission?.status === "graded").length;
    return [
      { label: "Total Assignments", value: assignments.length, icon: BookOpen, color: "text-blue-600 dark:text-blue-400" },
      { label: "Resubmissions Needed", value: resubmissionsCount, icon: AlertCircle, color: "text-amber-600 dark:text-amber-400" },
      { label: "Graded & Completed", value: gradedCount, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
    ];
  }, [assignments]);

  const submitAssignment = async (event) => {
    event.preventDefault();
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);
      const token = await getToken();
      const formData = new FormData();
      formData.append("submissionData", JSON.stringify({ textResponse: responseText }));

      const fileInput = document.getElementById("assignment-upload-files");
      if (fileInput?.files?.length) {
        Array.from(fileInput.files).forEach((file) => formData.append("files", file));
      }

      const { data } = await axios.post(
        `${backendURL}/api/assignments/${selectedAssignment._id}/submit`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Submission saved");
        setResponseText("");
        if (fileInput) fileInput.value = "";
        await fetchAssignments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dk-base">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-4">
              <FileEdit size={16} />
              Coursework
            </div>
            <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">My Assignments</h1>
            <p className="text-slate-500 dark:text-dk-text-2 mt-2">Track deadlines, submit files, review feedback, and resubmit when requested.</p>
          </div>
          <Button
            variant="primary"
            onClick={fetchAssignments}
            disabled={loading}
            className="shadow-lg shadow-blue-600/25 w-fit"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
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
                className="interactive-card rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className={`text-3xl font-bold font-space-grotesk ${stat.color}`}>{stat.value}</p>
                  <Icon size={20} className={stat.color} />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-dk-text-2">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Assignments Master-Detail Grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
          {/* Left: Assignment List */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="interactive-card rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-slate-100 dark:border-dk-border px-6 py-4 bg-slate-50/50 dark:bg-dk-surface-2">
                <h2 className="text-base font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Your Assignments</h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-dk-border">
                {assignments.map((assignment) => {
                  const submission = assignment.submission || {};
                  const isSelected = selectedAssignmentId === assignment._id;
                  return (
                    <button
                      key={assignment._id}
                      type="button"
                      onClick={() => setSelectedAssignmentId(assignment._id)}
                      className={`w-full text-left px-6 py-5 transition-all flex flex-col gap-2 ${
                        isSelected
                          ? "bg-blue-50/70 dark:bg-blue-950/30 border-l-4 border-blue-600 dark:border-blue-500"
                          : "hover:bg-slate-50 dark:hover:bg-dk-surface-2"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-bold text-sm font-space-grotesk text-slate-900 dark:text-dk-text">{assignment.title}</p>
                          <p className="text-xs text-slate-500 dark:text-dk-text-2">
                            {assignment.course?.courseTitle || "Untitled course"} • Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${badgeClasses[submission.status] || badgeClasses.not_submitted}`}>
                          {submission.status?.replace("_", " ") || "Not submitted"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-dk-text-2">
                        <span className="rounded-md bg-slate-100 dark:bg-dk-surface-2 px-2 py-0.5">{submission.attempts || 0} attempts</span>
                        <span className="rounded-md bg-slate-100 dark:bg-dk-surface-2 px-2 py-0.5">{submission.isLate ? "Late" : "On time"}</span>
                        {submission.maxScore ? (
                          <span className="rounded-md bg-slate-100 dark:bg-dk-surface-2 px-2 py-0.5">
                            {submission.totalScore || 0} / {submission.maxScore} pts
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
                {assignments.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-dk-text-2">
                    No assignments have been assigned yet.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right: Selected Assignment Details & Submission */}
          <div className="space-y-6">
            {selectedAssignment ? (
              <>
                <motion.div
                  key={selectedAssignment._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="interactive-card rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm space-y-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 dark:border-dk-border pb-5">
                    <div>
                      <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">{selectedAssignment.title}</h2>
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-dk-text-2">{selectedAssignment.course?.courseTitle || "Untitled course"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClasses[selectedAssignment.submission?.status] || badgeClasses.not_submitted}`}>
                      {selectedAssignment.submission?.status?.replace("_", " ") || "Not submitted"}
                    </span>
                  </div>

                  {selectedAssignment.description && (
                    <p className="text-sm text-slate-600 dark:text-dk-text-2 leading-relaxed">{selectedAssignment.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Due date</span>
                      <p className="font-semibold text-slate-800 dark:text-dk-text mt-0.5">
                        {selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleString() : "N/A"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Attempts</span>
                      <p className="font-semibold text-slate-800 dark:text-dk-text mt-0.5">
                        {selectedAssignment.submission?.attempts || 0} / {selectedAssignment.maxAttempts || 3}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Total points</span>
                      <p className="font-semibold text-slate-800 dark:text-dk-text mt-0.5">{selectedAssignment.totalPoints || 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Late policy</span>
                      <p className="font-semibold text-slate-800 dark:text-dk-text mt-0.5">
                        {selectedAssignment.allowLateSubmissions ? `${selectedAssignment.latePenaltyPercent || 0}% penalty` : "Closed on deadline"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-dk-text flex items-center gap-2">
                      <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                      Instructions
                    </h3>
                    {selectedAssignment.instructions ? (
                      <ol className="mt-2 list-decimal list-inside space-y-1 text-sm leading-relaxed text-slate-600 dark:text-dk-text-2">
                        {selectedAssignment.instructions.split(/\r?\n/).filter(Boolean).map((instruction, index) => (
                          <li key={`${instruction}-${index}`}>{instruction.replace(/^\d+[.)]\s*/, '')}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-dk-text-2">No instructions provided.</p>
                    )}
                  </div>

                  {Array.isArray(selectedAssignment.rubric) && selectedAssignment.rubric.length > 0 ? (
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border-2 bg-white dark:bg-dk-surface p-4 space-y-3">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-dk-text">Rubric</h3>
                      <div className="space-y-2.5">
                        {selectedAssignment.rubric.map((item) => (
                          <div key={item.rubricId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3.5 shadow-sm">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-dk-text">{item.title}</p>
                              <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-0.5">{item.description || "No description"}</p>
                            </div>
                            <span className="shrink-0 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-1 text-xs font-bold">
                              {item.maxScore} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(selectedAssignment.attachments) && selectedAssignment.attachments.length > 0 ? (
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50/50 dark:bg-dk-surface-2/50 p-4 space-y-3">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-dk-text flex items-center gap-2">
                        <Paperclip size={15} />
                        Attachments
                      </h3>
                      <div className="space-y-2">
                        {selectedAssignment.attachments.map((attachment) => (
                          <a
                            key={attachment.resourceId}
                            href={attachment.resourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            {attachment.resourceTitle}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </motion.div>

                {/* Submission Form */}
                <form onSubmit={submitAssignment} className="interactive-card rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Submit Work</h3>
                    <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-1">Attach files and write a short response. Resubmissions are supported if requested.</p>
                  </div>
                  <textarea
                    rows={5}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 text-slate-900 dark:text-dk-text px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-dk-text-3 resize-none"
                    placeholder="Write your response, notes, or explanations here..."
                  />
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-dk-text-2 mb-1.5">Attach Files (optional)</label>
                    <input
                      id="assignment-upload-files"
                      type="file"
                      multiple
                      className="block w-full rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 px-3 py-2 text-sm text-slate-600 dark:text-dk-text file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submitting}
                      className="shadow-md shadow-blue-600/20"
                    >
                      <Send size={15} />
                      {submitting ? "Submitting..." : selectedAssignment.submission?.status === "needs_resubmission" ? "Resubmit Assignment" : "Submit Assignment"}
                    </Button>
                    <Button
                      type="button"
                      onClick={fetchAssignments}
                      variant="outline"
                      className="px-5 py-2.5"
                    >
                      Refresh
                    </Button>
                  </div>
                </form>

                {/* Submission Status */}
                <div className="interactive-card rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Submission Status</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Score</span>
                      <p className="font-semibold text-slate-800 dark:text-dk-text mt-0.5">
                        {selectedAssignment.submission?.totalScore || 0} / {selectedAssignment.submission?.maxScore || selectedAssignment.totalPoints || 0}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Attempts</span>
                      <p className="font-semibold text-slate-800 dark:text-dk-text mt-0.5">{selectedAssignment.submission?.attempts || 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Late Status</span>
                      <p className="font-semibold text-slate-800 dark:text-dk-text mt-0.5">{selectedAssignment.submission?.isLate ? "Yes" : "No"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-3">
                      <span className="block text-xs font-medium text-slate-400 dark:text-dk-text-3">Grade</span>
                      <p className="font-semibold text-slate-800 dark:text-dk-text mt-0.5">{selectedAssignment.submission?.gradeLabel || "Not graded"}</p>
                    </div>
                  </div>
                  <div className="col-span-2 rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 p-4 text-sm">
                    <p className="font-bold text-slate-800 dark:text-dk-text">Instructor Feedback</p>
                    <p className="mt-1 text-slate-600 dark:text-dk-text-2 whitespace-pre-line leading-relaxed">
                      {selectedAssignment.submission?.feedback || "No feedback yet."}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-dk-border bg-white dark:bg-dk-surface p-12 text-center shadow-sm">
                <BookOpen className="mx-auto text-slate-400 dark:text-dk-text-3 mb-3" size={40} />
                <h3 className="text-lg font-bold font-space-grotesk text-slate-900 dark:text-dk-text">No assignment selected</h3>
                <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-1">Select an assignment from the list on the left to view details and submit work.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Assignments;

