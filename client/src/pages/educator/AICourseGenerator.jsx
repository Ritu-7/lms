import React, { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  Sparkles, BookOpen, ChevronDown, ChevronUp, RefreshCw,
  Save, ArrowLeft, ArrowRight, Wand2, FileText, Trash2,
  GraduationCap, Layers, CheckCircle2, Loader2, PenLine,
} from "lucide-react";
import { AppContext } from "../../context/AppContext";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const CATEGORIES = [
  "Development", "AI & ML", "Data Science", "Design",
  "Business", "Marketing", "Cyber Security", "Cloud & DevOps", "Other",
];

const AICourseGenerator = () => {
  const { backendURL, getToken } = useContext(AppContext);
  const navigate = useNavigate();

  // Step tracking
  const [step, setStep] = useState(1); // 1=Configure, 2=Review, 3=Saving

  // Step 1: Config form
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [numModules, setNumModules] = useState(3);
  const [lessonsPerModule, setLessonsPerModule] = useState(3);
  const [targetAudience, setTargetAudience] = useState("");
  const [instructions, setInstructions] = useState("");
  const [generating, setGenerating] = useState(false);

  // Step 2: Draft data
  const [draft, setDraft] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [saving, setSaving] = useState(false);
  const [regeneratingModule, setRegeneratingModule] = useState(null);

  // ── API helpers ──────────────────────────────────────────
  const authHeaders = async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  // ── Step 1: Generate ────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error("Please enter a topic.");
    setGenerating(true);
    try {
      const headers = await authHeaders();
      const { data } = await axios.post(
        `${backendURL}/api/ai/course/generate`,
        { topic, level, numModules, lessonsPerModule, targetAudience, instructions },
        { headers }
      );
      if (data.success) {
        setDraft(data.draft);
        setStep(2);
        // Expand first module by default
        setExpandedModules({ 0: true });
        toast.success("Course draft generated!");
      } else {
        toast.error(data.message || "Generation failed.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "AI generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Step 2: Edit helpers ────────────────────────────────
  const updateDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const updateModule = (mi, field, value) => {
    setDraft((prev) => {
      const modules = [...prev.modules];
      modules[mi] = { ...modules[mi], [field]: value };
      return { ...prev, modules };
    });
  };

  const updateLesson = (mi, li, field, value) => {
    setDraft((prev) => {
      const modules = [...prev.modules];
      const lessons = [...modules[mi].lessons];
      lessons[li] = { ...lessons[li], [field]: value };
      modules[mi] = { ...modules[mi], lessons };
      return { ...prev, modules };
    });
  };

  const deleteModule = (mi) => {
    if (!confirm("Remove this module from the draft?")) return;
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== mi),
    }));
  };

  const deleteLesson = (mi, li) => {
    setDraft((prev) => {
      const modules = [...prev.modules];
      modules[mi] = {
        ...modules[mi],
        lessons: modules[mi].lessons.filter((_, i) => i !== li),
      };
      return { ...prev, modules };
    });
  };

  const toggleModule = (mi) => {
    setExpandedModules((prev) => ({ ...prev, [mi]: !prev[mi] }));
  };

  // ── Regenerate a module ─────────────────────────────────
  const handleRegenerateModule = async (mi, action = "generate") => {
    const mod = draft.modules[mi];
    setRegeneratingModule(mi);
    try {
      const headers = await authHeaders();
      // Re-generate each lesson in the module
      const updatedLessons = [];
      for (const lesson of mod.lessons) {
        const { data } = await axios.post(
          `${backendURL}/api/ai/lesson/generate`,
          {
            courseTitle: draft.courseTitle,
            moduleTitle: mod.moduleTitle,
            lessonTitle: lesson.lessonTitle,
            level,
            action,
            existingContent: action !== "generate" ? lesson.lessonContent : "",
          },
          { headers }
        );
        if (data.success) {
          updatedLessons.push({
            ...lesson,
            lessonTitle: data.lesson.lessonTitle || lesson.lessonTitle,
            lessonContent: data.lesson.lessonContent || lesson.lessonContent,
            lessonSummary: data.lesson.lessonSummary || lesson.lessonSummary,
          });
        } else {
          updatedLessons.push(lesson);
        }
      }
      updateModule(mi, "lessons", updatedLessons);
      toast.success(`Module "${mod.moduleTitle}" ${action === "easier" ? "simplified" : action === "harder" ? "advanced" : "regenerated"}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Regeneration failed.");
    } finally {
      setRegeneratingModule(null);
    }
  };

  // ── Step 3: Save draft ──────────────────────────────────
  const handleSaveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const headers = await authHeaders();
      const { data } = await axios.post(
        `${backendURL}/api/ai/course/save-draft`,
        { draft },
        { headers }
      );
      if (data.success) {
        toast.success("🎉 Course draft saved! You can now review and publish it.");
        navigate("/educator/my-courses");
      } else {
        toast.error(data.message || "Save failed.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────

  // Step 1: Configure
  if (step === 1) {
    return (
      <div className="min-h-full flex-1 bg-slate-50 dark:bg-dk-base p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                <Sparkles size={20} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">
                AI Course Generator
              </h1>
            </div>
            <p className="text-slate-500 dark:text-dk-text-2 ml-[52px]">
              Describe your course topic and let AI create a complete course draft with modules, lessons, quizzes, and assignments.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-dk-surface rounded-2xl border border-slate-200 dark:border-dk-border p-6 shadow-sm space-y-5"
          >
            {/* Topic */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-dk-text mb-1.5">
                Course Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Machine Learning for Beginners"
                className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface px-4 py-3 text-sm text-slate-900 dark:text-dk-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Level + Category row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-dk-text mb-1.5">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface px-4 py-3 text-sm text-slate-900 dark:text-dk-text focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-dk-text mb-1.5">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. College students, working professionals"
                  className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface px-4 py-3 text-sm text-slate-900 dark:text-dk-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Modules + Lessons row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-dk-text mb-1.5">
                  Number of Modules ({numModules})
                </label>
                <input
                  type="range" min={1} max={10} value={numModules}
                  onChange={(e) => setNumModules(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-dk-text mb-1.5">
                  Lessons per Module ({lessonsPerModule})
                </label>
                <input
                  type="range" min={1} max={8} value={lessonsPerModule}
                  onChange={(e) => setLessonsPerModule(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-dk-text mb-1.5">
                Additional Instructions <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Focus on practical projects, include Python code examples, cover neural networks"
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface px-4 py-3 text-sm text-slate-900 dark:text-dk-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-blue-600/25"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating course with AI… (this may take 30-60 seconds)
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Course with AI
                </>
              )}
            </button>
          </motion.div>

          {/* Summary preview */}
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 dark:border-dk-border bg-white dark:bg-dk-surface p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-dk-text mb-2">What AI will generate:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: "Modules", value: numModules, icon: Layers },
                { label: "Lessons", value: numModules * lessonsPerModule, icon: BookOpen },
                { label: "Quizzes", value: numModules + 1, icon: FileText },
                { label: "Assignments", value: numModules, icon: PenLine },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-50 dark:bg-dk-surface p-3">
                  <s.icon size={18} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-xl font-bold text-slate-900 dark:text-dk-text">{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-dk-text-2">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Review & Edit
  if (step === 2 && draft) {
    return (
      <div className="min-h-full flex-1 bg-slate-50 dark:bg-dk-base p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-dk-border text-slate-500 hover:bg-slate-100 dark:hover:bg-dk-surface-2"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Review & Edit Course Draft</h1>
                <p className="text-sm text-slate-500 dark:text-dk-text-2">Edit any content before saving. Nothing is published yet.</p>
              </div>
            </div>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-lg shadow-emerald-600/25"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving…" : "Save as Draft"}
            </button>
          </div>

          {/* Course-level fields */}
          <div className="bg-white dark:bg-dk-surface rounded-2xl border border-slate-200 dark:border-dk-border p-5 mb-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-dk-text-2 uppercase tracking-wider mb-1">Course Title</label>
              <input
                type="text"
                value={draft.courseTitle || ""}
                onChange={(e) => updateDraftField("courseTitle", e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-dk-text focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-dk-text-2 uppercase tracking-wider mb-1">Description</label>
              <textarea
                value={draft.courseDescription || ""}
                onChange={(e) => updateDraftField("courseDescription", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface px-4 py-2.5 text-sm text-slate-900 dark:text-dk-text focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>
            {/* Features / Objectives chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-dk-text-2 uppercase tracking-wider mb-1">Learning Objectives</label>
                <div className="flex flex-wrap gap-1.5">
                  {(draft.learningObjectives || []).map((obj, i) => (
                    <span key={i} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full">
                      {obj}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-dk-text-2 uppercase tracking-wider mb-1">Prerequisites</label>
                <div className="flex flex-wrap gap-1.5">
                  {(draft.prerequisites || []).map((p, i) => (
                    <span key={i} className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modules */}
          <div className="space-y-4">
            {draft.modules.map((mod, mi) => (
              <div key={mi} className="bg-white dark:bg-dk-surface rounded-2xl border border-slate-200 dark:border-dk-border shadow-sm overflow-hidden">
                {/* Module header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-dk-surface-2 transition-colors"
                  onClick={() => toggleModule(mi)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-xs font-bold">
                      {mi + 1}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={mod.moduleTitle || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateModule(mi, "moduleTitle", e.target.value)}
                        className="text-sm font-semibold text-slate-900 dark:text-dk-text bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                      />
                      <p className="text-xs text-slate-500 dark:text-dk-text-2">
                        {mod.lessons?.length || 0} lessons · {mod.quiz?.questions?.length || 0} quiz questions · {mod.assignment ? "1 assignment" : "no assignment"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Regenerate actions */}
                    {regeneratingModule === mi ? (
                      <Loader2 size={14} className="animate-spin text-blue-500" />
                    ) : (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRegenerateModule(mi, "generate"); }}
                          title="Regenerate"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRegenerateModule(mi, "easier"); }}
                          title="Make easier"
                          className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors font-bold"
                        >
                          E
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRegenerateModule(mi, "harder"); }}
                          title="Make harder"
                          className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-bold"
                        >
                          H
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteModule(mi); }}
                          title="Delete module"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    {expandedModules[mi] ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded content */}
                {expandedModules[mi] && (
                  <div className="border-t border-slate-100 dark:border-dk-border px-5 py-4 space-y-4">
                    {/* Lessons */}
                    {mod.lessons?.map((lesson, li) => (
                      <div key={li} className="rounded-xl border border-slate-200 dark:border-dk-border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen size={14} className="text-blue-500" />
                            <input
                              type="text"
                              value={lesson.lessonTitle || ""}
                              onChange={(e) => updateLesson(mi, li, "lessonTitle", e.target.value)}
                              className="text-sm font-semibold text-slate-900 dark:text-dk-text bg-transparent border-none focus:outline-none p-0"
                            />
                          </div>
                          <button
                            onClick={() => deleteLesson(mi, li)}
                            className="p-1 rounded text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-dk-text-2">{lesson.lessonSummary}</p>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-500 hover:text-blue-600 font-medium">View/Edit Content</summary>
                          <textarea
                            value={lesson.lessonContent || ""}
                            onChange={(e) => updateLesson(mi, li, "lessonContent", e.target.value)}
                            rows={6}
                            className="mt-2 w-full rounded-lg border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface px-3 py-2 text-xs text-slate-700 dark:text-dk-text-2 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y"
                          />
                        </details>
                      </div>
                    ))}

                    {/* Quiz preview */}
                    {mod.quiz && mod.quiz.questions?.length > 0 && (
                      <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={14} className="text-indigo-600" />
                          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{mod.quiz.title || "Module Quiz"}</span>
                          <span className="text-xs text-indigo-500">{mod.quiz.questions.length} questions</span>
                        </div>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-indigo-500 font-medium">View Questions</summary>
                          <div className="mt-2 space-y-2">
                            {mod.quiz.questions.map((q, qi) => (
                              <div key={qi} className="bg-white dark:bg-dk-surface rounded-lg p-2.5 border border-indigo-100 dark:border-dk-border">
                                <p className="font-medium text-slate-800 dark:text-dk-text">{qi + 1}. {q.prompt}</p>
                                <div className="mt-1 space-y-0.5">
                                  {q.options?.map((o) => (
                                    <p key={o.optionId} className={`text-xs ${o.isCorrect ? "text-emerald-600 font-semibold" : "text-slate-500"}`}>
                                      {o.optionId}. {o.label} {o.isCorrect && "✓"}
                                    </p>
                                  ))}
                                </div>
                                {q.explanation && <p className="mt-1 text-xs text-slate-400 italic">{q.explanation}</p>}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Assignment preview */}
                    {mod.assignment && (
                      <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <PenLine size={14} className="text-amber-600" />
                          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{mod.assignment.title || "Assignment"}</span>
                          <span className="text-xs text-amber-500">{mod.assignment.totalPoints || 100} pts</span>
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-300/80">{mod.assignment.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Assessment */}
          {draft.finalAssessment && draft.finalAssessment.questions?.length > 0 && (
            <div className="mt-4 bg-white dark:bg-dk-surface rounded-2xl border border-slate-200 dark:border-dk-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap size={16} className="text-purple-600" />
                <span className="font-semibold text-slate-900 dark:text-dk-text">{draft.finalAssessment.title || "Final Assessment"}</span>
                <span className="text-xs text-slate-500">{draft.finalAssessment.questions.length} questions</span>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-purple-500 font-medium">View Questions</summary>
                <div className="mt-2 space-y-2">
                  {draft.finalAssessment.questions.map((q, qi) => (
                    <div key={qi} className="rounded-lg p-2.5 border border-slate-100 dark:border-dk-border">
                      <p className="font-medium text-slate-800 dark:text-dk-text">{qi + 1}. {q.prompt}</p>
                      <div className="mt-1 space-y-0.5">
                        {q.options?.map((o) => (
                          <p key={o.optionId} className={`text-xs ${o.isCorrect ? "text-emerald-600 font-semibold" : "text-slate-500"}`}>
                            {o.optionId}. {o.label} {o.isCorrect && "✓"}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Bottom action bar */}
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-dk-text"
            >
              <ArrowLeft size={14} /> Back to Configure
            </button>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 dark:text-dk-text-2">
                <CheckCircle2 size={12} className="inline mr-1 text-emerald-500" />
                {draft.modules.length} modules · {draft.modules.reduce((s, m) => s + (m.lessons?.length || 0), 0)} lessons ready
              </div>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-lg shadow-emerald-600/25"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving…" : "Save Draft to My Courses"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AICourseGenerator;
