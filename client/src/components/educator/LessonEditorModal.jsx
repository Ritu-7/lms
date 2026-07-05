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

const buildDraft = (lesson = {}, fallbackOrder = 1) => {
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

const LessonEditorModal = ({ open, mode = "add", initialLesson, fallbackOrder = 1, onClose, onSave }) => {
  const { backendURL, getToken } = useContext(AppContext);
  const [lessonData, setLessonData] = useState(buildDraft(initialLesson, fallbackOrder));
  const [attachmentDraft, setAttachmentDraft] = useState(defaultAttachmentDraft());
  const [uploading, setUploading] = useState("");
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLessonData(buildDraft(initialLesson, fallbackOrder));
    setAttachmentDraft(defaultAttachmentDraft());
  }, [open, initialLesson, fallbackOrder]);

  useEffect(() => {
    if (!open || quillRef.current || !editorRef.current) return;

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

  const uploadLessonAsset = async (file) => {
    if (!file) return null;

    setUploading(file.name);
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
      setUploading("");
    }
  };

  const handleAssetUpload = async (file, target) => {
    if (!file) return;
    try {
      const fileData = await uploadLessonAsset(file);
      if (!fileData) return;

      if (target === "video") {
        setLessonData((prev) => ({
          ...prev,
          lessonVideoUrl: fileData.url,
          lessonType: "video",
        }));
      }

      if (target === "pdf") {
        setLessonData((prev) => ({
          ...prev,
          lessonPdfUrl: fileData.url,
          lessonType: "pdf",
        }));
      }

      if (target === "attachment") {
        setLessonData((prev) => ({
          ...prev,
          lessonAttachments: [
            ...prev.lessonAttachments,
            {
              attachmentId:
                globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              attachmentLabel: attachmentDraft.attachmentLabel || file.name,
              attachmentUrl: fileData.url,
              attachmentFileName: fileData.fileName || file.name,
              attachmentMimeType: fileData.mimeType || file.type,
              attachmentSize: fileData.size || file.size || 0,
              attachmentResourceType: fileData.resourceType || "auto",
            },
          ],
        }));
        setAttachmentDraft(defaultAttachmentDraft());
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Asset upload failed");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const richText = quillRef.current ? quillRef.current.root.innerHTML : lessonData.lessonRichTextContent;
    onSave({
      ...lessonData,
      lessonDuration: Number(lessonData.lessonDuration || 0),
      lessonRichTextContent: richText,
      richTextContent: richText,
      previewMode: Boolean(lessonData.previewMode),
      isPreviewFree: Boolean(lessonData.previewMode),
      contentType: lessonData.lessonType,
      lectureType: lessonData.lessonType,
      lectureUrl:
        lessonData.lessonType === "pdf"
          ? lessonData.lessonPdfUrl
          : lessonData.lessonType === "external_link" || lessonData.lessonType === "quiz" || lessonData.lessonType === "assignment"
            ? lessonData.lessonExternalLink
            : lessonData.lessonVideoUrl,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
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
                onChange={(e) => setLessonData((prev) => ({ ...prev, lessonDuration: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="0"
              />
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

          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 p-4">
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Video URL</span>
              <input
                type="url"
                value={lessonData.lessonVideoUrl}
                onChange={(e) => setLessonData((prev) => ({ ...prev, lessonVideoUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="YouTube or hosted video URL"
              />
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600">
                  <img src={assets.file_upload_icon} alt="" className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload video"}
                  <input
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={(e) => handleAssetUpload(e.target.files?.[0], "video")}
                  />
                </label>
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">PDF URL</span>
              <input
                type="url"
                value={lessonData.lessonPdfUrl}
                onChange={(e) => setLessonData((prev) => ({ ...prev, lessonPdfUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="PDF file URL"
              />
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600">
                  <img src={assets.file_upload_icon} alt="" className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => handleAssetUpload(e.target.files?.[0], "pdf")}
                  />
                </label>
              </div>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">External link</span>
            <input
              type="url"
              value={lessonData.lessonExternalLink}
              onChange={(e) => setLessonData((prev) => ({ ...prev, lessonExternalLink: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Optional external reference or assignment link"
            />
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-700">Rich text content</span>
              <span className="text-xs text-gray-500">Use this for notes, instructions, or embedded HTML.</span>
            </div>
            <div ref={editorRef} className="min-h-40 rounded-lg border border-gray-300 bg-white" />
          </div>

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

          <div className="space-y-3 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Attachments</h3>
              <span className="text-xs text-gray-500">Upload PDFs, docs, slides, or supporting files.</span>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={attachmentDraft.attachmentLabel}
                onChange={(e) => setAttachmentDraft((prev) => ({ ...prev, attachmentLabel: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Attachment label"
              />
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                {uploading ? "Uploading..." : "Choose file"}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,image/*,video/*"
                  onChange={(e) => handleAssetUpload(e.target.files?.[0], "attachment")}
                />
              </label>
            </div>

            {lessonData.lessonAttachments.length > 0 && (
              <div className="space-y-2">
                {lessonData.lessonAttachments.map((attachment, index) => (
                  <div
                    key={attachment.attachmentId || index}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-800">{attachment.attachmentLabel}</p>
                      <p className="truncate text-xs text-gray-500">{attachment.attachmentUrl}</p>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600"
                      onClick={() =>
                        setLessonData((prev) => ({
                          ...prev,
                          lessonAttachments: prev.lessonAttachments.filter(
                            (_, attachmentIndex) => attachmentIndex !== index
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
