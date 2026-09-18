import React, { useState } from 'react'
import { Send, MessagesSquare } from 'lucide-react'
import {
  StudentAiHeader,
  StudentAiStatus,
  glassCard,
  useStudentAi,
} from './studentAiShared'

const CourseChatPanel = ({ courseId, courseTitle, currentLessonTitle }) => {
  const { post } = useStudentAi()
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const ask = async () => {
    const text = question.trim()
    if (!text || !courseId) return
    setLoading(true)
    setError(null)
    setQuestion('')
    const history = [...messages, { role: 'user', text }]
    setMessages(history)
    try {
      const data = await post('/api/ai/student/course-chat', {
        courseId,
        question: text,
        messages: history.map((item) => ({ role: item.role, text: item.text })),
      })
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer, citations: data.citations || [] }])
    } catch (err) {
      setError({ message: err.message, isNoKey: err.isNoKey })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={`${glassCard} p-5`}>
      <StudentAiHeader
        icon={MessagesSquare}
        title="Chat with this course"
        subtitle={`Answers use only ${courseTitle || 'this course'}'s lessons, PDFs, and your notes for this course.`}
      />
      <StudentAiStatus loading={false} error={error} empty={false}>
        <div className="max-h-72 overflow-y-auto space-y-3 mb-3">
          {messages.length === 0 && !loading ? (
            <p className="text-sm text-slate-500 dark:text-dk-text-2">
              Ask about a concept in the current lesson{currentLessonTitle ? ` (“${currentLessonTitle}”)` : ''}. Citations will name the lesson used.
            </p>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-8'
                    : 'bg-slate-100 dark:bg-dk-surface-2 text-slate-800 dark:text-dk-text mr-4'
                }`}
              >
                <p>{message.text}</p>
                {message.citations?.length ? (
                  <ul className="mt-2 space-y-1 text-xs opacity-90">
                    {message.citations.map((citation) => (
                      <li key={`${citation.lessonId}-${citation.section}`}>
                        {citation.lessonTitle}
                        {citation.chapterTitle ? ` · ${citation.chapterTitle}` : ''}
                        {citation.section ? ` · ${citation.section}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          )}
          {loading ? <p className="text-xs text-slate-400">Looking only in this course’s lessons, PDFs, and your notes…</p> : null}
        </div>
      </StudentAiStatus>
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') ask() }}
          className="flex-1 rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-base px-3 py-2.5 text-sm outline-none"
          placeholder="Ask a question about this course only"
        />
        <button
          type="button"
          onClick={ask}
          disabled={loading || !question.trim()}
          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Send size={14} />
        </button>
      </div>
    </section>
  )
}

export default CourseChatPanel
