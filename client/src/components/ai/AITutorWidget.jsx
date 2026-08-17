import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Brain,
  Sparkles,
  Send,
  BookOpen,
  HelpCircle,
  ClipboardList,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Settings,
  Key,
} from 'lucide-react'
import { AppContext } from '../../context/AppContext'
import { aiRequest } from '../../utils/aiClient'

const QUICK_ACTIONS = [
  {
    id: 'explain',
    label: 'Explain Topic',
    icon: BookOpen,
    color: 'blue',
    buildPrompt: (course) =>
      course
        ? `Explain the core concepts of "${course}" in simple, beginner-friendly terms.`
        : 'Explain the most important concept from my current lesson in simple terms.',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: ClipboardList,
    color: 'violet',
    buildPrompt: (course) =>
      course
        ? `Give me a concise summary of the key points from "${course}".`
        : 'Give me a concise summary of this lesson with key points.',
  },
  {
    id: 'quiz',
    label: 'Quiz Me',
    icon: HelpCircle,
    color: 'emerald',
    buildPrompt: (course) =>
      course
        ? `Generate a 3-question quiz to test my understanding of "${course}".`
        : 'Generate a 3-question quiz to test my understanding of this topic.',
  },
]

const COLOR_MAP = {
  blue: 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300',
  violet: 'bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 border-violet-100 dark:border-violet-900/40 text-violet-700 dark:text-violet-300',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
}

const getCourseTitle = (course) =>
  course?.courseData?.courseTitle ||
  course?.courseTitle ||
  course?.title ||
  null

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const CompactNoKeyState = () => {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-violet-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
        <Key size={24} className="text-indigo-500" />
      </div>
      <h3 className="text-sm font-bold font-space-grotesk text-slate-900 dark:text-dk-text mb-2">
        AI Features Locked
      </h3>
      <p className="text-xs text-slate-500 dark:text-dk-text-2 mb-4 leading-relaxed">
        Add your Gemini API key to unlock the AI Tutor.
      </p>
      <button
        onClick={() => navigate('/settings/ai')}
        className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-lg shadow-blue-600/25"
      >
        <Settings size={14} />
        Configure API Key
      </button>
    </div>
  )
}

const WidgetBubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  const isError = msg.isError

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`shrink-0 h-6 w-6 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-blue-600 text-white'
            : isError
            ? 'bg-rose-100 dark:bg-rose-950/50'
            : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
        }`}
      >
        {isUser ? (
          <span className="text-[8px] font-bold">You</span>
        ) : isError ? (
          <AlertTriangle size={11} className="text-rose-500" />
        ) : (
          <Brain size={11} className="text-white" />
        )}
      </div>
      <div
        className={`rounded-xl px-3 py-2 text-xs max-w-[85%] ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : isError
            ? 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 rounded-tl-sm'
            : 'bg-white dark:bg-dk-surface border border-slate-100 dark:border-white/[0.08] text-slate-800 dark:text-dk-text rounded-tl-sm'
        }`}
      >
        {isUser || isError ? (
          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-xs max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const TypingIndicator = () => (
  <div className="flex gap-2">
    <div className="shrink-0 h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
      <Brain size={11} className="text-white" />
    </div>
    <div className="rounded-xl rounded-tl-sm bg-white dark:bg-dk-surface border border-slate-100 dark:border-white/[0.08] px-3 py-2">
      <div className="flex gap-1 items-center h-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-blue-400"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
    </div>
  </div>
)

const AITutorWidget = ({ onOpenFull }) => {
  const { enrolledCourses } = useContext(AppContext)
  const { getToken } = useAuth()
  const { user } = useUser()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isNoKeyError, setIsNoKeyError] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const currentCourse = enrolledCourses?.[0] || null
  const courseTitle = getCourseTitle(currentCourse)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? input).trim()
      if (!text || isLoading) return

      const userMsg = {
        id: `u_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: formatTime(),
      }

      const nextMessages = [...messages, userMsg]
      setMessages(nextMessages)
      setInput('')
      setIsLoading(true)
      setIsNoKeyError(false)

      try {
        const historyForApi = nextMessages.filter(
          (m) => !m.isError && (m.role === 'user' || m.role === 'assistant')
        )

        const { data } = await aiRequest({
          backendURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
          getToken,
          path: '/api/ai/tutor/chat',
          data: {
            messages: historyForApi,
            model: 'gemini-3.5-flash',
            courseTitle,
          },
          retries: 1,
        })

        const assistantMsg = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: data?.response || '',
          timestamp: formatTime(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        const isNoKey = err.statusCode === 403
        setIsNoKeyError(isNoKey)
        const errMsg = isNoKey
          ? 'No API key configured. Please set up your Gemini API key in AI Settings.'
          : `Something went wrong: ${err.message}`

        setMessages((prev) => [
          ...prev,
          {
            id: `e_${Date.now()}`,
            role: 'assistant',
            content: errMsg,
            isError: true,
            timestamp: formatTime(),
          },
        ])
      } finally {
        setIsLoading(false)
        inputRef.current?.focus()
      }
    },
    [courseTitle, getToken, input, isLoading, messages]
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isNoKeyError && messages.length === 0) {
    return <CompactNoKeyState />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-2">
            <div className="relative mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Brain size={22} className="text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white dark:border-dk-surface flex items-center justify-center"
              >
                <Sparkles size={9} className="text-white" />
              </motion.div>
            </div>
            <h3 className="text-sm font-bold font-space-grotesk text-slate-900 dark:text-dk-text mb-1">
              {user ? `Hi, ${user.firstName || 'there'}!` : 'AI Tutor'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-dk-text-2 mb-4 leading-relaxed">
              Ask anything about your courses — I'm here to help.
            </p>
            {courseTitle && (
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                <BookOpen size={10} />
                {courseTitle}
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 w-full">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => handleSend(action.buildPrompt(courseTitle))}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all text-xs font-semibold ${COLOR_MAP[action.color]}`}
                  >
                    <Icon size={13} />
                    {action.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <WidgetBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-100 dark:border-white/[0.06] p-3 bg-white/80 dark:bg-dk-surface backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI Tutor..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-white/[0.04] px-3 py-2 text-xs text-slate-800 dark:text-dk-text placeholder:text-slate-400 dark:placeholder:text-dk-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all max-h-20"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shadow-sm shadow-blue-600/20"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
        <button
          onClick={onOpenFull}
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-dk-text-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ExternalLink size={10} />
          Open full AI Tutor
        </button>
      </div>
    </div>
  )
}

export default AITutorWidget

