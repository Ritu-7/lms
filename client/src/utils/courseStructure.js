export const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
};

const mapLessons = (lessons = []) =>
  lessons
    .map((lesson) => ({
      _id: getEntityId(lesson),
      title: lesson.lessonTitle || lesson.lectureTitle || "Untitled lesson",
    }))
    .filter((lesson) => lesson._id);

export const getCourseModules = (course) => {
  if (!course) return [];

  const populatedModules = Array.isArray(course.modules)
    ? course.modules.filter((module) => module && typeof module === "object" && (module.moduleTitle || Array.isArray(module.lessons)))
    : [];

  if (populatedModules.length) {
    return populatedModules
      .map((module) => ({
        _id: getEntityId(module),
        title: module.moduleTitle || module.chapterTitle || "Untitled module",
        lessons: mapLessons(module.lessons),
      }))
      .filter((module) => module._id);
  }

  return (course.courseContent || [])
    .map((chapter) => ({
      _id: getEntityId(chapter),
      title: chapter.chapterTitle || "Untitled module",
      lessons: mapLessons(chapter.chapterContent || chapter.lessons || []),
    }))
    .filter((module) => module._id);
};

export const validateCourseModuleLesson = ({ course, module, lesson }) => {
  if (!getEntityId(course)) return "Please select a course";
  if (!getEntityId(module)) return "Please select a module";
  if (!getEntityId(lesson)) return "Please select a lesson";
  return "";
};
