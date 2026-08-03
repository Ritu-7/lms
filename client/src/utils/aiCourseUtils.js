const getCourseTitleValue = (course) =>
  course?.courseData?.courseTitle || course?.courseTitle || course?.title || ''

const getChapters = (course) => {
  if (Array.isArray(course?.courseContent)) return course.courseContent
  if (Array.isArray(course?.modules)) return course.modules
  return []
}

const getLessons = (chapter = {}) => {
  if (Array.isArray(chapter?.chapterContent)) return chapter.chapterContent
  if (Array.isArray(chapter?.lessons)) return chapter.lessons
  return []
}

const getLessonVideoUrl = (lesson = {}) =>
  lesson.lectureVideoUrl ||
  lesson.lectureUrl ||
  lesson.lessonVideoUrl ||
  lesson.lessonUrl ||
  lesson.lessonPdfUrl ||
  lesson.lessonExternalLink ||
  lesson.lectureExternalLink ||
  ''

const getLessonText = (lesson = {}) =>
  [
    lesson.lectureTitle,
    lesson.lessonTitle,
    lesson.lectureRichTextContent,
    lesson.lessonRichTextContent,
    lesson.lectureTranscriptPlaceholder,
    lesson.lessonTranscriptPlaceholder,
    lesson.lectureDescription,
    lesson.lessonDescription,
    lesson.lessonSummary,
    lesson.summary,
  ]
    .filter(Boolean)
    .join('\n\n')

export const getPrimaryCourse = (enrolledCourses = []) =>
  Array.isArray(enrolledCourses) ? enrolledCourses.find(Boolean) || null : null

export const getPrimaryLesson = (course) => {
  const chapters = getChapters(course)

  for (const chapter of chapters) {
    const lessons = getLessons(chapter)
    for (const lesson of lessons) {
      const lessonType = lesson.lectureType || lesson.lessonType || lesson.contentType || 'video'
      const sourceText = getLessonText(lesson)
      const videoUrl = getLessonVideoUrl(lesson)

      if (lessonType === 'video' || videoUrl || sourceText) {
        return {
          lesson,
          lessonType,
          title: lesson.lectureTitle || lesson.lessonTitle || 'Untitled lesson',
          videoUrl,
          sourceText,
        }
      }
    }
  }

  return null
}

export const getLessonSourceText = (lesson) => getLessonText(lesson)

export const getCourseTitle = getCourseTitleValue

export const hasLessonSource = (lesson) => Boolean(getLessonText(lesson).trim())