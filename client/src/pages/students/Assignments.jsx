import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import Footer from "../../components/students/Footer";
import Loading from "../../components/students/Loading";

const badgeClasses = {
  not_submitted: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  late_submitted: "bg-amber-100 text-amber-700",
  needs_resubmission: "bg-rose-100 text-rose-700",
  graded: "bg-emerald-100 text-emerald-700",
  returned: "bg-orange-100 text-orange-700",
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
        fileInput.value = "";
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
    <div className="min-h-screen bg-gray-50/30">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-12 space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Assignments</h1>
            <p className="mt-1 text-sm text-gray-500">Track deadlines, submit files, review feedback, and resubmit when requested.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="rounded-full bg-white px-3 py-1 border">{assignments.length} assignments</span>
            <span className="rounded-full bg-white px-3 py-1 border">{assignments.filter((assignment) => assignment.submission?.status === "needs_resubmission").length} resubmissions</span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Your assignments</h2>
            </div>
            <div className="divide-y">
              {assignments.map((assignment) => {
                const submission = assignment.submission || {};
                return (
                  <button
                    key={assignment._id}
                    type="button"
                    onClick={() => setSelectedAssignmentId(assignment._id)}
                    className={`w-full text-left px-5 py-4 transition-colors ${selectedAssignmentId === assignment._id ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{assignment.title}</p>
                        <p className="text-xs text-gray-500">{assignment.course?.courseTitle || "Untitled course"} • Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "N/A"}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[submission.status] || badgeClasses.not_submitted}`}>{submission.status || "not_submitted"}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>{submission.attempts || 0} attempts</span>
                      <span>{submission.isLate ? "Late" : "On time"}</span>
                      {submission.maxScore ? <span>{submission.totalScore || 0} / {submission.maxScore}</span> : null}
                    </div>
                  </button>
                );
              })}
              {assignments.length === 0 ? <div className="px-5 py-10 text-center text-sm text-gray-500">No assignments have been assigned yet.</div> : null}
            </div>
          </div>

          <div className="space-y-6">
            {selectedAssignment ? (
              <>
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedAssignment.title}</h2>
                      <p className="mt-1 text-sm text-gray-500">{selectedAssignment.course?.courseTitle || "Untitled course"}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[selectedAssignment.submission?.status] || badgeClasses.not_submitted}`}>{selectedAssignment.submission?.status || "not_submitted"}</span>
                  </div>

                  <p className="mt-4 text-sm text-gray-600">{selectedAssignment.description}</p>
                  <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                    <p><span className="font-semibold text-gray-800">Due date:</span> {selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleString() : "N/A"}</p>
                    <p><span className="font-semibold text-gray-800">Attempts:</span> {selectedAssignment.submission?.attempts || 0} / {selectedAssignment.maxAttempts || 3}</p>
                    <p><span className="font-semibold text-gray-800">Total points:</span> {selectedAssignment.totalPoints || 0}</p>
                    <p><span className="font-semibold text-gray-800">Late policy:</span> {selectedAssignment.allowLateSubmissions ? `${selectedAssignment.latePenaltyPercent || 0}% penalty` : "Closed on deadline"}</p>
                  </div>

                  <div className="mt-4 rounded-xl bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-800">Instructions</h3>
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{selectedAssignment.instructions || "No instructions provided."}</p>
                  </div>

                  {Array.isArray(selectedAssignment.rubric) && selectedAssignment.rubric.length > 0 ? (
                    <div className="mt-4 rounded-xl border p-4">
                      <h3 className="font-semibold text-gray-800">Rubric</h3>
                      <div className="mt-3 space-y-3 text-sm">
                        {selectedAssignment.rubric.map((item) => (
                          <div key={item.rubricId} className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 p-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-500">{item.description || "No description"}</p>
                            </div>
                            <span className="text-xs font-semibold text-gray-500">{item.maxScore} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(selectedAssignment.attachments) && selectedAssignment.attachments.length > 0 ? (
                    <div className="mt-4 rounded-xl border p-4">
                      <h3 className="font-semibold text-gray-800">Attachments</h3>
                      <div className="mt-3 space-y-2">
                        {selectedAssignment.attachments.map((attachment) => (
                          <a key={attachment.resourceId} href={attachment.resourceUrl} target="_blank" rel="noreferrer" className="block rounded-lg border px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                            {attachment.resourceTitle}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <form onSubmit={submitAssignment} className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Submit work</h3>
                    <p className="text-sm text-gray-500">Attach files and write a short response. Resubmissions are supported if your instructor requests them.</p>
                  </div>
                  <textarea rows="6" value={responseText} onChange={(e) => setResponseText(e.target.value)} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" placeholder="Your response or notes" />
                  <input id="assignment-upload-files" type="file" multiple className="block w-full rounded-lg border bg-white px-3 py-2 text-sm" />
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      {submitting ? "Submitting..." : selectedAssignment.submission?.status === "needs_resubmission" ? "Resubmit Assignment" : "Submit Assignment"}
                    </button>
                    <button type="button" onClick={fetchAssignments} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700">Refresh</button>
                  </div>
                </form>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900">Submission status</h3>
                  <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                    <p><span className="font-semibold text-gray-800">Score:</span> {selectedAssignment.submission?.totalScore || 0} / {selectedAssignment.submission?.maxScore || selectedAssignment.totalPoints || 0}</p>
                    <p><span className="font-semibold text-gray-800">Attempts:</span> {selectedAssignment.submission?.attempts || 0}</p>
                    <p><span className="font-semibold text-gray-800">Late:</span> {selectedAssignment.submission?.isLate ? "Yes" : "No"}</p>
                    <p><span className="font-semibold text-gray-800">Grade:</span> {selectedAssignment.submission?.gradeLabel || "Not graded"}</p>
                  </div>
                  <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-800">Instructor feedback</p>
                    <p className="mt-1 whitespace-pre-line">{selectedAssignment.submission?.feedback || "No feedback yet."}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border bg-white p-10 text-center text-gray-500 shadow-sm">No assignment selected.</div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Assignments;
