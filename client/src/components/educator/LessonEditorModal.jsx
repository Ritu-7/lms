import React, { useContext, useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import {
  formatResourceSize,
  getResourceBadgeLabel,
  normalizeResourceCollection,
  normalizeResourceRecord,
  resourceToLegacyAttachment,
} from "../../utils/resourceUtils";
import {
  fetchVideoDurationMinutes,
  getDurationFromVideoFile,
} from "../../utils/videoDurationUtils";

const buildDraft = (lessonInput, fallbackOrder = 1) => {
  const lesson = lessonInput || {};
  const lessonType = lesson.lessonType || lesson.contentType || lesson.lectureType || "video";
  return {
    lessonId: lesson.lessonId || lesson.lectureId || "",
    lessonTitle: lesson.lessonTitle || lesson.lectureTitle || "",
    lessonDuration: lesson.lessonDuration ?? lesson.lectureDuration ?? "",
    lessonType,
    lessonVideoUrl: lesson.lessonVideoUrl || lesson.lectureVideoUrl || lesson.lectureUrl || "",
    lessonPdfUrl: lesson.lessonPdfUrl || lesson.lecturePdfUrl || "",
    lessonRichTextContent: lesson.lessonRichTextContent || lesson.lectureRichTextContent || "",
    lessonExternalLink: lesson.lessonExternalLink || lesson.lectureExternalLink || "",
    lessonTranscriptPlaceholder:
      lesson.lessonTranscriptPlaceholder || lesson.lectureTranscriptPlaceholder || "",
    lessonCompletionRules: lesson.lessonCompletionRules || lesson.lectureCompletionRules || lesson.completionRules || {},
    lessonResources: normalizeResourceCollection(
      lesson.lessonResources,
      lesson.resources,
      lesson.lessonAttachments,
      lesson.lectureResources,
      lesson.lectureAttachments
    ),
    lessonStatus: lesson.lessonStatus || lesson.lectureStatus || "draft",
    previewMode: Boolean(lesson.previewMode ?? lesson.isPreviewFree),
    isPreviewFree: Boolean(lesson.isPreviewFree ?? lesson.previewMode),
    lessonOrder: lesson.lessonOrder || lesson.lectureOrder || fallbackOrder,
  };
};

const defaultResourceDraft = () => ({
  resourceTitle: "",
  resourceType: "pdf",
  resourceUrl: "",
  resourceFile: null,
});

const LINK_CONTENT_TYPES = new Set(["external_link", "quiz", "assignment"]);

const LessonEditorModal = ({ open, mode = "add", initialLesson, fallbackOrder = 1, onClose, onSave }) => {
  const { backendURL, getToken } = useContext(AppContext);
  const [lessonData, setLessonData] = useState(buildDraft(initialLesson, fallbackOrder));
  const [resourceDraft, setResourceDraft] = useState(defaultResourceDraft());
  const [uploading, setUploading] = useState({ video: false, pdf: false, resource: false });
  const [durationAutoDetected, setDurationAutoDetected] = useState(false);
  const [durationDetecting, setDurationDetecting] = useState(false);
  const [durationManuallyEdited, setDurationManuallyEdited] = useState(false);
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const videoInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const resourceInputRef = useRef(null);
  const durationDetectTimerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLessonData(buildDraft(initialLesson, fallbackOrder));
    setResourceDraft(defaultResourceDraft());
    setDurationAutoDetected(false);
    setDurationDetecting(false);
    setDurationManuallyEdited(false);
  }, [open, initialLesson, fallbackOrder]);

  useEffect(() => {
    if (!open) {
      if (quillRef.current) {
        quillRef.current = null;
      }
      return;
    }

    if (!editorRef.current || quillRef.current) return;

    quillRef.current = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: "Write lesson notes or rich text here...",
    });
    quillRef.current.root.innerHTML = lessonData.lessonRichTextContent || "";
  }, [open, lessonData.lessonRichTextContent]);

  useEffect(() => {
    if (open && quillRef.current) {
      quillRef.current.root.innerHTML = lessonData.lessonRichTextContent || "";
    }
  }, [open, lessonData.lessonRichTextContent]);

  useEffect(
    () => () => {
      if (durationDetectTimerRef.current) {
        clearTimeout(durationDetectTimerRef.current);
      }
    },
    []
  );

  const applyDetectedDuration = (minutes) => {
    if (!minutes || durationManuallyEdited) return;
    setLessonData((prev) => ({ ...prev, lessonDuration: minutes }));
    setDurationAutoDetected(true);
  };

  const detectDurationFromVideoUrl = async (url) => {
    if (!url?.trim() || durationManuallyEdited) return;

    setDurationDetecting(true);
    try {
      const minutes = await fetchVideoDurationMinutes(url, { backendURL, getToken });
      if (minutes) {
        applyDetectedDuration(minutes);
      }
    } finally {
      setDurationDetecting(false);
    }
  };

  const scheduleDurationDetection = (url) => {
    if (durationDetectTimerRef.current) {
      clearTimeout(durationDetectTimerRef.current);
    }

    if (!url?.trim() || durationManuallyEdited) return;

    durationDetectTimerRef.current = setTimeout(() => {
      detectDurationFromVideoUrl(url);
    }, 700);
  };

  const uploadLessonAsset = async (file, target) => {
    if (!file) return null;

    setUploading((prev) => ({ ...prev, [target]: true }));
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post(`${backendURL}/api/educator/upload-lesson-asset`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!data.success) {
        throw new Error(data.message || "Upload failed");
      }

      return data.file;
    } finally {
      setUploading((prev) => ({ ...prev, [target]: false }));
    }
  };

  const resetFileInput = (ref) => {
    if (ref.current) {
      ref.current.value = "";
    }
  };

  const handleAssetUpload = async (file, target) => {
    if (!file) return;

    try {
      if (target === "video") {
        const localDuration = await getDurationFromVideoFile(file);
        const fileData = await uploadLessonAsset(file, target);
        if (!fileData) return;

        const cloudinaryDuration = Number(fileData.durationMinutes || 0);
        const detectedDuration = cloudinaryDuration || localDuration;

        setLessonData((prev) => ({
          ...prev,
          lessonVideoUrl: fileData.url,
          lessonType: prev.lessonType === "rich_text" ? prev.lessonType : "video",
          ...(detectedDuration && !durationManuallyEdited ? { lessonDuration: detectedDuration } : {}),
        }));

        if (detectedDuration && !durationManuallyEdited) {
          setDurationAutoDetected(true);
        }

        toast.success("Video uploaded successfully");
        resetFileInput(videoInputRef);
        return;
      }

      const fileData = await uploadLessonAsset(file, target);
      if (!fileData) return;

      if (target === "pdf") {
        setLessonData((prev) => ({
          ...prev,
          lessonPdfUrl: fileData.url,
          lessonType: prev.lessonType === "rich_text" ? prev.lessonType : "pdf",
        }));
        toast.success("PDF uploaded successfully");
        resetFileInput(pdfInputRef);
        return;
      }

      if (target === "resource") {
        const newResource = normalizeResourceRecord({
          resourceId:
            globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          resourceTitle: resourceDraft.resourceTitle || file.name,
          resourceType: fileData.resourceType || resourceDraft.resourceType || "auto",
          resourceUrl: fileData.url,
          resourceFileName: fileData.fileName || file.name,
          resourceMimeType: fileData.mimeType || file.type,
          resourceSize: fileData.size || file.size || 0,
        });

        setLessonData((prev) => ({
          ...prev,
          lessonResources: [...prev.lessonResources, newResource],
        }));
        setResourceDraft(defaultResourceDraft());
        toast.success("Attachment uploaded successfully");
        resetFileInput(resourceInputRef);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.code === "ERR_NETWORK" ? "Upload failed — check your connection and try again" : error.message) ||
        "Asset upload failed";
      toast.error(message);
    }
  };

  const validateLesson = () => {
    if (!lessonData.lessonTitle.trim()) {
      toast.error("Lesson title is required");
      return false;
    }

    const { lessonType } = lessonData;

    if (lessonType === "video" && !lessonData.lessonVideoUrl.trim()) {
      toast.error("Add a video URL or upload a video file");
      return false;
    }

    if (lessonType === "pdf" && !lessonData.lessonPdfUrl.trim()) {
      toast.error("Add a PDF URL or upload a PDF file");
      return false;
    }

    if (LINK_CONTENT_TYPES.has(lessonType) && !lessonData.lessonExternalLink.trim()) {
      toast.error("External link is required for this content type");
      return false;
    }

    if (lessonType === "rich_text") {
      const richText = quillRef.current ? quillRef.current.root.innerHTML : lessonData.lessonRichTextContent;
      const plainText = richText.replace(/<[^>]+>/g, "").trim();
      if (!plainText) {
        toast.error("Rich text content is required");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateLesson()) return;

    const richText = quillRef.current ? quillRef.current.root.innerHTML : lessonData.lessonRichTextContent;
    const legacyAttachments = lessonData.lessonResources.map(resourceToLegacyAttachment);
    const duration = Number(lessonData.lessonDuration || 0);

    onSave({
      ...lessonData,
      lessonTitle: lessonData.lessonTitle.trim(),
      lessonDuration: duration,
      lectureTitle: lessonData.lessonTitle.trim(),
      lectureDuration: duration,
      lessonRichTextContent: richText,
      richTextContent: richText,
      previewMode: Boolean(lessonData.previewMode),
      isPreviewFree: Boolean(lessonData.previewMode),
      contentType: lessonData.lessonType,
      lectureType: lessonData.lessonType,
      lectureUrl:
        lessonData.lessonType === "pdf"
          ? lessonData.lessonPdfUrl.trim()
          : LINK_CONTENT_TYPES.has(lessonData.lessonType)
            ? lessonData.lessonExternalLink.trim()
            : lessonData.lessonVideoUrl.trim(),
      lessonVideoUrl: lessonData.lessonVideoUrl.trim(),
      lessonPdfUrl: lessonData.lessonPdfUrl.trim(),
      lessonExternalLink: lessonData.lessonExternalLink.trim(),
      resources: lessonData.lessonResources,
      lessonAttachments: legacyAttachments,
      lectureAttachments: legacyAttachments,
    });
  };

  const showVideoFields = lessonData.lessonType === "video";
  const showPdfFields = lessonData.lessonType === "pdf";
  const showExternalLinkField = LINK_CONTENT_TYPES.has(lessonData.lessonType);
  const showRichTextField = lessonData.lessonType === "rich_text" || lessonData.lessonType === "video" || lessonData.lessonType === "pdf";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-dk-surface shadow-2xl dark:border dark:border-dk-border">
        <div className="flex items-center justify-between border-b dark:border-dk-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === "edit" ? "Edit Lesson" : "Add Lesson"}
            </h2>
            <p className="text-sm text-gray-500">Build a lesson with media, notes, and attachments.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
            <img src={assets.cross_icon} alt="Close" className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Lesson title</span>
              <input
                type="text"
                value={lessonData.lessonTitle}
                onChange={(e) => setLessonData((prev) => ({ ...prev, lessonTitle: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Lesson title"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Duration (minutes)</span>
              <input
                type="number"
                min="0"
                value={lessonData.lessonDuration}
                onChange={(e) => {
                  setDurationManuallyEdited(true);
                  setDurationAutoDetected(false);
                  setLessonData((prev) => ({ ...prev, lessonDuration: e.target.value }));
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Enter manually or auto-detect from video"
              />
              <p className="text-xs text-gray-500">
                {durationDetecting
                  ? "Detecting duration from video..."
                  : durationAutoDetected
                    ? "Duration auto-detected from video. Edit to override."
                    : "Paste a YouTube URL or upload a video to auto-detect duration."}
              </p>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Content type</span>
              <select
                value={lessonData.lessonType}
                onChange={(e) => setLessonData((prev) => ({ ...prev, lessonType: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
                <option value="rich_text">Rich Text</option>
                <option value="external_link">External Link</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select
                value={lessonData.lessonStatus}
                onChange={(e) => setLessonData((prev) => ({ ...prev, lessonStatus: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 dark:bg-dk-base p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={lessonData.previewMode}
                onChange={(e) =>
                  setLessonData((prev) => ({
                    ...prev,
                    previewMode: e.target.checked,
                    isPreviewFree: e.target.checked,
                  }))
                }
              />
              Preview mode
            </label>

            <p className="text-xs text-gray-500">
              Preview lessons remain accessible without enrollment, just like the current free lecture behavior.
            </p>
          </div>

          {showVideoFields && (
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-gray-700">Video URL</span>
              <input
                type="text"
                value={lessonData.lessonVideoUrl}
                onChange={(e) => {
                  const nextUrl = e.target.value;
                  setLessonData((prev) => ({ ...prev, lessonVideoUrl: nextUrl }));
                  scheduleDurationDetection(nextUrl);
                }}
                onBlur={(e) => detectDurationFromVideoUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="YouTube or hosted video URL"
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600">
                  <img src={assets.file_upload_icon} alt="" className="h-4 w-4" />
                  {uploading.video ? "Uploading..." : "Upload video"}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    hidden
                    disabled={uploading.video}
                    onChange={(e) => handleAssetUpload(e.target.files?.[0], "video")}
                  />
                </label>
                {lessonData.lessonVideoUrl && (
                  <a
                    href={lessonData.lessonVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Preview video link
                  </a>
                )}
              </div>
            </label>
          )}

          {showPdfFields && (
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-gray-700">PDF URL</span>
              <input
                type="text"
                value={lessonData.lessonPdfUrl}
                onChange={(e) => setLessonData((prev) => ({ ...prev, lessonPdfUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="PDF file URL"
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600">
                  <img src={assets.file_upload_icon} alt="" className="h-4 w-4" />
                  {uploading.pdf ? "Uploading..." : "Upload PDF"}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    hidden
                    disabled={uploading.pdf}
                    onChange={(e) => handleAssetUpload(e.target.files?.[0], "pdf")}
                  />
                </label>
                {lessonData.lessonPdfUrl && (
                  <a
                    href={lessonData.lessonPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Preview PDF link
                  </a>
                )}
              </div>
            </label>
          )}

          {showExternalLinkField && (
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-gray-700">
                {lessonData.lessonType === "quiz"
                  ? "Quiz link"
                  : lessonData.lessonType === "assignment"
                    ? "Assignment link"
                    : "External link"}
              </span>
              <input
                type="url"
                value={lessonData.lessonExternalLink}
                onChange={(e) => setLessonData((prev) => ({ ...prev, lessonExternalLink: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder={
                  lessonData.lessonType === "quiz"
                    ? "https://example.com/quiz/..."
                    : lessonData.lessonType === "assignment"
                      ? "https://example.com/assignment/..."
                      : "Optional external reference or assignment link"
                }
                required={showExternalLinkField}
              />
              {lessonData.lessonExternalLink && (
                <a
                  href={lessonData.lessonExternalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs font-medium text-blue-600 hover:underline"
                >
                  Open link in new tab
                </a>
              )}
            </label>
          )}

          {showRichTextField && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-700">Rich text content</span>
                <span className="text-xs text-gray-500">
                  {lessonData.lessonType === "rich_text"
                    ? "Required for rich text lessons."
                    : "Optional notes or instructions."}
                </span>
              </div>
              <div ref={editorRef} className="min-h-40 rounded-lg border border-gray-300 bg-white dark:bg-dk-surface" />
            </div>
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Transcript placeholder</span>
            <textarea
              rows="3"
              value={lessonData.lessonTranscriptPlaceholder}
              onChange={(e) =>
                setLessonData((prev) => ({
                  ...prev,
                  lessonTranscriptPlaceholder: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Placeholder text for transcript generation or manual transcription notes"
            />
          </label>

          <div className="space-y-3 rounded-xl border border-gray-200 dark:border-dk-border dark:bg-dk-surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Attachments</h3>
              <span className="text-xs text-gray-500">Upload PDFs, docs, slides, or supporting files.</span>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={resourceDraft.resourceTitle}
                onChange={(e) => setResourceDraft((prev) => ({ ...prev, resourceTitle: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Attachment label"
              />
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                {uploading.resource ? "Uploading..." : "Choose file"}
                <input
                  ref={resourceInputRef}
                  type="file"
                  hidden
                  disabled={uploading.resource}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,image/*,video/*"
                  onChange={(e) => handleAssetUpload(e.target.files?.[0], "resource")}
                />
              </label>
            </div>

            {lessonData.lessonResources.length > 0 && (
              <div className="space-y-2">
                {lessonData.lessonResources.map((resource, index) => (
                  <div
                    key={resource.resourceId || index}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-800">{resource.resourceTitle}</p>
                      <p className="truncate text-xs text-gray-500">
                        {getResourceBadgeLabel(resource.resourceType)}
                        {resource.resourceSize ? ` · ${formatResourceSize(resource.resourceSize)}` : ""}
                        {resource.resourceUrl ? ` · ${resource.resourceUrl}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600"
                      onClick={() =>
                        setLessonData((prev) => ({
                          ...prev,
                          lessonResources: prev.lessonResources.filter(
                            (_, resourceIndex) => resourceIndex !== index
                          ),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {mode === "edit" ? "Update Lesson" : "Add Lesson"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonEditorModal;
