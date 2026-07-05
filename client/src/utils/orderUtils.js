export const moveItem = (items = [], fromIndex, toIndex) => {
  const next = [...items];
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= next.length ||
    toIndex >= next.length ||
    fromIndex === toIndex
  ) {
    return next;
  }

  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

export const normalizeModuleOrder = (modules = []) =>
  modules.map((module, index) => ({
    ...module,
    chapterOrder: index + 1,
    chapterContent: normalizeLessonOrder(module.chapterContent || []),
  }));

export const normalizeLessonOrder = (lessons = []) =>
  lessons.map((lesson, index) => ({
    ...lesson,
    lessonOrder: index + 1,
    lectureOrder: index + 1,
  }));
