import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/students/Loading";

const emptyRubricItem = () => ({ rubricId: globalThis.crypto?.randomUUID?.() || `${Date.now()}`, title: "", description: "", maxScore: 10 });

const buildDraft = () => ({
  title: "",
  description: "",
  instructions: "",
  course: "",
  module: "",
  lesson: "",
  status: "draft",
  dueDate: "",
  allowLateSubmissions: true,
  latePenaltyPercent: 0,
  maxAttempts: 3,
  totalPoints: 100,
  tags: "",
  rubric: [emptyRubricItem()],
});

const badgeClasses = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  late_submitted: "bg-amber-100 text-amber-700",
  needs_resubmission: "bg-rose-100 text-rose-700",
  graded: "bg-emerald-100 text-emerald-700",
  returned: "bg-orange-100 text-orange-700",
};

const Assignments = () => {
  const { backendURL, getToken } = useContext(AppContext);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(buildDraft());
  const [editingId, setEditingId] = useState("");
  const [reviewDraft, setReviewDraft] = useState({ feedback: "", gradeLabel: "", totalScore: "", maxScore: "", needsResubmission: false, rubricScores: [] });

  const fetchCourses = useCallback(async () => {
    const token = await getToken();
    const { data } = await axios.get(`${backendURL}/api/educator/courses`, { headers: { Authorization: `Bearer ${token}` } });
    if (data.success) setCourses(Array.isArray(data.courses) ? data.courses : []);
  }, [backendURL, getToken]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/assignments/educator/list`, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
        if (!selectedAssignmentId && data.assignments?.length) {
          setSelectedAssignmentId(data.assignments[0]._id);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [backendURL, getToken, selectedAssignmentId]);

  const fetchSubmissions = useCallback(async (assignmentId) => {
    if (!assignmentId) return;
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/assignments/educator/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backendURL, getToken]);

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
  }, [fetchCourses, fetchAssignments]);

  useEffect(() => {
    fetchSubmissions(selectedAssignmentId);
  }, [fetchSubmissions, selectedAssignmentId]);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment._id === selectedAssignmentId) || null,
    [assignments, selectedAssignmentId]
  );

  const resetForm = () => {
    setDraft(buildDraft());
    setEditingId("");
  };

  const startEdit = (assignment) => {
    setEditingId(assignment._id);
    setDraft({
      title: assignment.title || "",
      description: assignment.description || "",
      instructions: assignment.instructions || "",
      course: assignment.course?._id || assignment.course || "",
      module: assignment.module || "",
      lesson: assignment.lesson || "",
      status: assignment.status || "draft",
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : "",
      allowLateSubmissions: Boolean(assignment.allowLateSubmissions),
      latePenaltyPercent: Number(assignment.latePenaltyPercent || 0),
      maxAttempts: Number(assignment.maxAttempts || 3),
      totalPoints: Number(assignment.totalPoints || 100),
      tags: Array.isArray(assignment.tags) ? assignment.tags.join(", ") : "",
      rubric: Array.isArray(assignment.rubric) && assignment.rubric.length ? assignment.rubric : [emptyRubricItem()],
    });
  };

  const handleRubricChange = (index, key, value) => {
    setDraft((prev) => {
      const rubric = [...prev.rubric];
      rubric[index] = { ...rubric[index], [key]: value };
      return { ...prev, rubric };
    });
  };

  const addRubricItem = () => setDraft((prev) => ({ ...prev, rubric: [...prev.rubric, emptyRubricItem()] }));
  const removeRubricItem = (index) => setDraft((prev) => ({ ...prev, rubric: prev.rubric.filter((_, rubricIndex) => rubricIndex !== index) }));

  const saveAssignment = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const token = await getToken();
      const formData = new FormData();
      formData.append(
        "assignmentData",
        JSON.stringify({
          ...draft,
          rubric: draft.rubric.map((item, index) => ({ ...item, order: index + 1, maxScore: Number(item.maxScore || 0) })),
          latePenaltyPercent: Number(draft.latePenaltyPercent || 0),
          maxAttempts: Number(draft.maxAttempts || 3),
          totalPoints: Number(draft.totalPoints || 100),
          course: draft.course,
          dueDate: draft.dueDate,
        })
      );

      const fileInput = document.getElementById("assignment-files");
      if (fileInput?.files?.length) {
        Array.from(fileInput.files).forEach((file) => formData.append("files", file));
      }

      const requestConfig = { headers: { Authorization: `Bearer ${token}` } };
      const endpoint = editingId ? `${backendURL}/api/assignments/educator/${editingId}` : `${backendURL}/api/assignments/educator`;
      const method = editingId ? axios.put : axios.post;
      const { data } = await method(endpoint, formData, requestConfig);
      if (data.success) {
        toast.success(editingId ? "Assignment updated" : "Assignment created");
        resetForm();
        fileInput.value = "";
        await fetchAssignments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this assignment and its submissions?")) return;
    try {
      const token = await getToken();
      const { data } = await axios.delete(`${backendURL}/api/assignments/educator/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success(data.message);
        await fetchAssignments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const updateSubmissionReview = async (submissionId) => {
    try {
      const token = await getToken();
      const { data } = await axios.patch(
        `${backendURL}/api/assignments/educator/submissions/${submissionId}/review`,
        { reviewData: reviewDraft },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Submission updated");
        await fetchSubmissions(selectedAssignmentId);
        await fetchAssignments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const setSelectedAssignment = (assignmentId) => {
    setSelectedAssignmentId(assignmentId);
    const assignment = assignments.find((item) => item._id === assignmentId);
    setReviewDraft({
      feedback: "",
      gradeLabel: "",
      totalScore: assignment?.totalPoints || 0,
      maxScore: assignment?.totalPoints || 0,
      needsResubmission: false,
      rubricScores: (assignment?.rubric || []).map((item) => ({ rubricId: item.rubricId, title: item.title, maxScore: item.maxScore, score: 0, feedback: "" })),
    });
  };

  if (loading && !assignments.length) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 md:p-8 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Assignments</h1>
          <p className="mt-1 text-sm text-gray-500">Create assignments, attach files, set deadlines, and review submissions in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white px-3 py-1 border">{assignments.length} assignments</span>
          <span className="rounded-full bg-white px-3 py-1 border">{submissions.length} submissions</span>
          <button onClick={resetForm} className="rounded-full bg-blue-600 px-4 py-1.5 text-white font-medium">New Assignment</button>
        </div>
      </div>

      <form onSubmit={saveAssignment} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{editingId ? "Edit assignment" : "Create assignment"}</h2>
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
              <span className="text-sm font-medium text-gray-700">Due date</span>
              <input type="datetime-local" required value={draft.dueDate} onChange={(e) => setDraft((prev) => ({ ...prev, dueDate: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Total points</span>
              <input type="number" min="0" value={draft.totalPoints} onChange={(e) => setDraft((prev) => ({ ...prev, totalPoints: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Max attempts</span>
              <input type="number" min="1" value={draft.maxAttempts} onChange={(e) => setDraft((prev) => ({ ...prev, maxAttempts: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Late penalty %</span>
              <input type="number" min="0" max="100" value={draft.latePenaltyPercent} onChange={(e) => setDraft((prev) => ({ ...prev, latePenaltyPercent: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 md:col-span-2">
              <input type="checkbox" checked={draft.allowLateSubmissions} onChange={(e) => setDraft((prev) => ({ ...prev, allowLateSubmissions: e.target.checked }))} />
              Allow late submissions
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Tags</span>
              <input value={draft.tags} onChange={(e) => setDraft((prev) => ({ ...prev, tags: e.target.value }))} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500" placeholder="research, coding, reflection" />
            </label>
            <div className="md:col-span-2 space-y-2">
              <span className="text-sm font-medium text-gray-700">Attachments</span>
              <input id="assignment-files" type="file" multiple className="block w-full rounded-lg border bg-white px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-800">Rubric</h3>
              <button type="button" onClick={addRubricItem} className="text-sm font-semibold text-blue-600">Add criterion</button>
            </div>
            {draft.rubric.map((item, index) => (
              <div key={item.rubricId || index} className="grid gap-3 rounded-lg border bg-white p-3 md:grid-cols-[1fr_1fr_120px_auto]">
                <input value={item.title} onChange={(e) => handleRubricChange(index, "title", e.target.value)} placeholder="Criterion title" className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
                <input value={item.description} onChange={(e) => handleRubricChange(index, "description", e.target.value)} placeholder="Description" className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
                <input type="number" min="0" value={item.maxScore} onChange={(e) => handleRubricChange(index, "maxScore", e.target.value)} placeholder="Max" className="rounded-lg border px-3 py-2 outline-none focus:border-blue-500" />
                <button type="button" onClick={() => removeRubricItem(index)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600">Remove</button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            {editingId ? <button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700">Cancel</button> : null}
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : editingId ? "Update Assignment" : "Create Assignment"}</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Assignment details</h2>
            {selectedAssignment ? (
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p className="text-base font-semibold text-gray-900">{selectedAssignment.title}</p>
                <p>{selectedAssignment.description}</p>
                <p><span className="font-medium text-gray-800">Course:</span> {selectedAssignment.course?.courseTitle || "Untitled"}</p>
                <p><span className="font-medium text-gray-800">Due:</span> {selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleString() : "N/A"}</p>
                <p><span className="font-medium text-gray-800">Status:</span> <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClasses[selectedAssignment.status] || badgeClasses.draft}`}>{selectedAssignment.status}</span></p>
                <div className="grid gap-2 text-xs text-gray-500">
                  <p>Submissions: {selectedAssignment.submissionSummary?.submitted || 0}</p>
                  <p>Graded: {selectedAssignment.submissionSummary?.graded || 0}</p>
                  <p>Late: {selectedAssignment.submissionSummary?.late || 0}</p>
                  <p>Needs resubmission: {selectedAssignment.submissionSummary?.needsResubmission || 0}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Select an assignment to inspect submissions.</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Submissions</h2>
            <div className="mt-4 space-y-3">
              {submissions.length > 0 ? submissions.map((submission) => (
                <div key={submission._id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{submission.student?.name || submission.student?.email || "Student"}</p>
                      <p className="text-xs text-gray-500">Attempt {submission.summary?.attempts || 0} • {submission.summary?.submittedAt ? new Date(submission.summary.submittedAt).toLocaleString() : "No submission"}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[submission.summary?.status] || badgeClasses.submitted}`}>{submission.summary?.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">Score: {submission.summary?.totalScore || 0} / {submission.summary?.maxScore || 0}</p>
                  <p className="text-sm text-gray-600">Feedback: {submission.feedback || "No feedback yet"}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setReviewDraft((prev) => ({ ...prev, needsResubmission: true }))} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-amber-700">Request Resubmission</button>
                    <button type="button" onClick={() => updateSubmissionReview(submission._id)} className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">Save Review</button>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500">No submissions yet.</p>}
            </div>
          </div>
        </div>
      </form>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Assignment</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {assignments.map((assignment) => (
              <tr key={assignment._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setSelectedAssignment(assignment._id)} className="font-medium text-gray-900 hover:underline">{assignment.title}</button>
                  <div className="text-xs text-gray-500">{assignment.submissionSummary?.submitted || 0} submissions</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{assignment.course?.courseTitle || "Untitled"}</td>
                <td className="px-4 py-3 text-gray-600">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "N/A"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[assignment.status] || badgeClasses.draft}`}>{assignment.status}</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button type="button" onClick={() => startEdit(assignment)} className="text-blue-600 font-medium hover:underline">Edit</button>
                  <button type="button" onClick={() => deleteAssignment(assignment._id)} className="text-red-600 font-medium hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-10 text-center text-gray-500">No assignments created yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Assignments;
