import React, { useContext, useEffect, useRef, useState } from "react";
import uniqid from "uniqid";
import Quill from "quill";
import axios from "axios";
import "quill/dist/quill.snow.css";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import LessonEditorModal from "../../components/educator/LessonEditorModal";
import { moveItem, normalizeLessonOrder, normalizeModuleOrder } from "../../utils/orderUtils";

const AddCourse = () => {
  const { backendURL, getToken } = useContext(AppContext);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [courseDiscount, setCourseDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [modules, setModules] = useState([]);
  const [courseFeatures, setCourseFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState("");
  const [draggedModuleIndex, setDraggedModuleIndex] = useState(null);
  const [draggedLesson, setDraggedLesson] = useState(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonMode, setLessonMode] = useState("add");
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Write course description here...",
      });
    }
  }, []);

  const handleFeature = (action, index) => {
    if (action === "add") {
      if (featureInput.trim()) {
        setCourseFeatures([...courseFeatures, featureInput.trim()]);
        setFeatureInput("");
      }
    } else if (action === "remove") {
      setCourseFeatures(courseFeatures.filter((_, i) => i !== index));
    }
  };

  const createModule = () => {
    const title = prompt("Enter Module Name:");
    if (!title) return;

    const newModule = {
      chapterId: uniqid(),
      chapterTitle: title,
      chapterContent: [],
      collapsed: false,
      chapterOrder: modules.length + 1,
    };

    setModules((prev) => normalizeModuleOrder([...prev, newModule]));
  };

  const removeModule = (moduleId) => {
    setModules((prev) => normalizeModuleOrder(prev.filter((module) => module.chapterId !== moduleId)));
  };

  const toggleModule = (moduleId) => {
    setModules((prev) =>
      prev.map((module) =>
        module.chapterId === moduleId ? { ...module, collapsed: !module.collapsed } : module
      )
    );
  };

  const openLessonModal = (moduleId, lesson = null) => {
    setActiveModuleId(moduleId);
    setActiveLesson(lesson);
    setLessonMode(lesson ? "edit" : "add");
    setLessonModalOpen(true);
  };

  const closeLessonModal = () => {
    setLessonModalOpen(false);
    setActiveModuleId(null);
    setActiveLesson(null);
    setLessonMode("add");
  };

  const saveLesson = (lesson) => {
    if (!activeModuleId) return;

    setModules((prev) =>
      normalizeModuleOrder(
        prev.map((module) => {
          if (module.chapterId !== activeModuleId) return module;

          const currentLessons = [...(module.chapterContent || [])];

          if (lessonMode === "edit" && activeLesson?.lessonId) {
            const updatedLessons = currentLessons.map((item) =>
              item.lessonId === activeLesson.lessonId ? { ...item, ...lesson } : item
            );
            return { ...module, chapterContent: normalizeLessonOrder(updatedLessons) };
          }

          const newLesson = {
            ...lesson,
            lessonId: lesson.lessonId || uniqid(),
            lectureId: lesson.lectureId || lesson.lessonId || uniqid(),
          };
          return {
            ...module,
            chapterContent: normalizeLessonOrder([...currentLessons, newLesson]),
          };
        })
      )
    );

    closeLessonModal();
  };

  const deleteLesson = (moduleId, lessonId) => {
    setModules((prev) =>
      normalizeModuleOrder(
        prev.map((module) => {
          if (module.chapterId !== moduleId) return module;
          return {
            ...module,
            chapterContent: normalizeLessonOrder(
              module.chapterContent.filter((lesson) => lesson.lessonId !== lessonId)
            ),
          };
        })
      )
    );
  };

  const reorderModules = (targetIndex) => {
    if (draggedModuleIndex === null) return;
    setModules((prev) => normalizeModuleOrder(moveItem(prev, draggedModuleIndex, targetIndex)));
    setDraggedModuleIndex(null);
  };

  const reorderLessons = (moduleId, targetIndex) => {
    if (!draggedLesson || draggedLesson.moduleId !== moduleId) return;
    setModules((prev) =>
      normalizeModuleOrder(
        prev.map((module) => {
          if (module.chapterId !== moduleId) return module;
          return {
            ...module,
            chapterContent: normalizeLessonOrder(
              moveItem(module.chapterContent, draggedLesson.lessonIndex, targetIndex)
            ),
          };
        })
      )
    );
    setDraggedLesson(null);
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();

      if (!image) {
        return toast.error("Please upload course thumbnail");
      }

      const courseData = {
        courseTitle,
        category: courseCategory.trim(),
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice: Number(coursePrice),
        discount: Number(courseDiscount),
        courseFeatures,
        courseContent: normalizeModuleOrder(modules),
      };

      const formData = new FormData();
      formData.append("thumbnail", image);
      formData.append("courseData", JSON.stringify(courseData));

      const token = await getToken();
      const { data } = await axios.post(`${backendURL}/api/educator/add-course`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success(data.message);
        setCourseTitle("");
        setCoursePrice(0);
        setCourseDiscount(0);
        setImage(null);
        setModules([]);
        setCourseFeatures([]);
        setCourseCategory("");
        if (quillRef.current) {
          quillRef.current.root.innerHTML = "";
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="h-screen overflow-scroll flex flex-col items-start md:p-8 p-4 pt-8 bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-5">
        <div className="flex flex-col gap-1">
          <p className="text-gray-600 font-medium">Course Title</p>
          <input
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            placeholder="Type Here"
            className="outline-none border border-gray-400 rounded-md p-2"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-gray-600 font-medium">Category</p>
          <input
            type="text"
            value={courseCategory}
            onChange={(e) => setCourseCategory(e.target.value)}
            placeholder="Type Here"
            className="outline-none border border-gray-400 rounded-md p-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-gray-600 font-medium mb-2">Course Description</p>
          <div ref={editorRef} className="h-40 bg-white" />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-gray-600 font-medium">Price</p>
            <input
              type="number"
              value={coursePrice}
              onChange={(e) => setCoursePrice(e.target.value)}
              className="w-full border border-gray-400 rounded-md p-2"
              placeholder="0"
            />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 font-medium">Discount (%)</p>
            <input
              type="number"
              value={courseDiscount}
              onChange={(e) => setCourseDiscount(e.target.value)}
              className="w-full border border-gray-400 rounded-md p-2"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <img src={assets.file_upload_icon} alt="" className="w-4" />
            Upload Thumbnail
            <input type="file" onChange={(e) => setImage(e.target.files[0])} accept="image/*" hidden />
          </label>
          {image && <img className="h-12 rounded" src={URL.createObjectURL(image)} alt="" />}
        </div>

        <div className="space-y-2">
          <p className="text-gray-600 font-medium">Course Features</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="Add a feature"
              className="flex-1 border border-gray-400 rounded-md p-2"
            />
            <button
              type="button"
              onClick={() => handleFeature("add")}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {courseFeatures.map((feature, index) => (
              <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                <span>{feature}</span>
                <button
                  type="button"
                  onClick={() => handleFeature("remove", index)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Modules</h3>
              <p className="text-sm text-gray-500">Drag to reorder modules and lessons within each module.</p>
            </div>
            <button
              type="button"
              onClick={createModule}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
            >
              + Add Module
            </button>
          </div>

          {modules.map((module, moduleIndex) => (
            <div
              key={module.chapterId}
              draggable
              onDragStart={() => setDraggedModuleIndex(moduleIndex)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => reorderModules(moduleIndex)}
              className="bg-white border rounded-lg overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 bg-gray-100">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleModule(module.chapterId)}
                >
                  <span className="text-gray-400 cursor-grab text-lg">☰</span>
                  <img
                    src={assets.dropdown_icon}
                    alt=""
                    width={12}
                    className={`${module.collapsed ? "-rotate-90" : ""} transition-transform`}
                  />
                  <span className="font-semibold">
                    {moduleIndex + 1}. {module.chapterTitle}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase text-gray-500">
                    {module.chapterContent.length} lessons
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openLessonModal(module.chapterId);
                    }}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    + Lesson
                  </button>
                  <img
                    src={assets.cross_icon}
                    className="cursor-pointer w-3"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeModule(module.chapterId);
                    }}
                    alt="remove"
                  />
                </div>
              </div>

              {!module.collapsed && (
                <div className="p-4 space-y-2">
                  {module.chapterContent.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.lessonId}
                      draggable
                      onDragStart={() =>
                        setDraggedLesson({ moduleId: module.chapterId, lessonIndex, lessonId: lesson.lessonId })
                      }
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => reorderLessons(module.chapterId, lessonIndex)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-gray-400 cursor-grab">☰</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-800">
                            {lessonIndex + 1}. {lesson.lectureTitle || lesson.lessonTitle}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {lesson.lectureType || lesson.lessonType || "video"} • {lesson.lectureStatus || lesson.lessonStatus || "draft"} •{" "}
                            {lesson.lectureDuration || lesson.lessonDuration || 0} min
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase">
                        {(lesson.previewMode || lesson.isPreviewFree) && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">Preview</span>
                        )}
                        <button
                          type="button"
                          onClick={() => openLessonModal(module.chapterId, lesson)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLesson(module.chapterId, lesson.lessonId)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button type="submit" className="bg-black text-white px-8 py-2.5 rounded font-bold uppercase">
          ADD COURSE
        </button>
      </form>

      <LessonEditorModal
        open={lessonModalOpen}
        mode={lessonMode}
        initialLesson={activeLesson}
        fallbackOrder={
          activeModuleId
            ? (modules.find((module) => module.chapterId === activeModuleId)?.chapterContent.length || 0) + 1
            : 1
        }
        onClose={closeLessonModal}
        onSave={saveLesson}
      />
    </div>
  );
};

export default AddCourse;
