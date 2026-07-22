// AITutor.jsx — Production-Ready AI Tutor Page
// ─────────────────────────────────────────────
// • Removes ALL dummy data (SAMPLE_HISTORY, DEMO_RESPONSE, fake credits, mock stats)
// • Keeps all real integrations: AppContext, Clerk auth, enrolledCourses, userData
// • Calls Gemini API directly (VITE_GEMINI_API_KEY) — no backend AI endpoint needed
// • Session-based conversation history (stored in state, cleared on new chat)
// • Full dark mode, responsive, Framer Motion, markdown + code blocks, file upload UI

import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  Brain,
  Sparkles,
  Send,
  Plus,
  Paperclip,
  Image as ImageIcon,
  Code2,
  FileText,
  Mic,
  ChevronDown,
  Check,
  Copy,
  RotateCcw,
  BookOpen,
  Zap,
  ClipboardList,
  HelpCircle,
  StickyNote,
  Search,
  X,
  AlertTriangle,
  Lock,
  Loader2,
  PanelLeft,
  MessageSquare,
} from 'lucide-react'
import { AppContext } from '../../context/AppContext'

// ─── Constants ─────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

const AI_MODELS = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini Flash',
    description: 'Fast & smart',
    icon: Zap,
    iconColor: 'text-amber-500',
  },
  {
    id: 'gemini-2.0-flash-thinking',
    name: 'Gemini Thinking',
    description: 'Deep reasoning',
    icon: Brain,
    iconColor: 'text-violet-500',
  },
]

const QUICK_ACTIONS = [
  {
    id: 'explain',
    label: 'Explain Topic',
    icon: BookOpen,
    color: 'blue',
    buildPrompt: (course) =>
      course
        ? `Explain the core concepts of "${course}" in simple, beginner-friendly terms with real-world examples.`
        : 'Explain the most important concept from my current lesson in simple, beginner-friendly terms with examples.',
  },
  {
    id: 'summarize',
    label: 'Summarize Lesson',
    icon: ClipboardList,
    color: 'violet',
    buildPrompt: (course) =>
      course
        ? `Give me a concise summary of the key points from "${course}" with bullet points.`
        : 'Give me a concise summary of this lesson with the key points in bullet form.',
  },
  {
    id: 'quiz',
    label: 'Generate Quiz',
    icon: HelpCircle,
    color: 'emerald',
    buildPrompt: (course) =>
      course
        ? `Generate a 5-question multiple-choice quiz to test my understanding of "${course}". Include the correct answers.`
        : 'Generate a 5-question multiple choice quiz to test my understanding of this topic. Include the correct answers.',
  },
  {
    id: 'notes',
    label: 'Generate Notes',
    icon: StickyNote,
    color: 'amber',
    buildPrompt: (course) =>
      course
        ? `Create structured study notes in markdown format for "${course}". Use headers, bullet points, and code blocks where relevant.`
        : 'Create structured study notes in markdown format. Use headers, bullet points, and code blocks where relevant.',
  },
  {
    id: 'code',
    label: 'Explain Code',
    icon: Code2,
    color: 'rose',
    buildPrompt: (course) =>
      course
        ? `Show me a practical code example related to "${course}" and explain it step by step.`
        : 'Show me a practical code example for this topic and explain each part step by step.',
  },
  {
    id: 'search',
    label: 'Deeper Dive',
    icon: Search,
    color: 'indigo',
    buildPrompt: (course) =>
      course
        ? `What are the most advanced or nuanced aspects of "${course}" that I should know to truly master this topic?`
        : 'What are the most important advanced concepts I should study next to deepen my understanding of this topic?',
  },
]

const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 border-violet-100 dark:border-violet-900/40 text-violet-700 dark:text-violet-300',
    icon: 'text-violet-600 dark:text-violet-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300',
    icon: 'text-rose-600 dark:text-rose-400',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getCourseTitle = (course) =>
  course?.courseData?.courseTitle ||
  course?.courseTitle ||
  course?.title ||
  null

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// ─── Gemini API Call ──────────────────────────────────────────────────────────
async function callGeminiAPI(messages, model = 'gemini-2.0-flash') {
  if (!GEMINI_API_KEY) {
    throw new Error('NO_API_KEY')
  }

  // Convert our message history to Gemini's format
  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
        systemInstruction: {
          parts: [
            {
              text: `You are LearnSphereAI's expert AI Tutor — a knowledgeable, patient, and encouraging learning assistant.
Your role is to help students understand course material deeply. You:
- Explain concepts clearly with relevant examples and analogies
- Use markdown formatting: headers, bullet points, bold, code blocks
- Write code examples with proper syntax highlighting using \`\`\`language blocks
- Generate quizzes, flashcards, and study notes when asked
- Are concise but thorough — avoid unnecessary repetition
- Acknowledge when you're uncertain rather than guessing
- Encourage the learner and celebrate their curiosity
Always format mathematical expressions using LaTeX notation.`,
            },
          ],
        },
      }),
    }
  )

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from AI')
  return text
}

// ─── MessageContent — Markdown + Math + Code Blocks ──────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      title="Copy"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

const MessageContent = ({ text, isStreaming }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-headings:font-space-grotesk prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-blue-600 dark:prose-code:text-blue-300 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // eslint-disable-next-line no-unused-vars
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const codeText = String(children).replace(/\n$/, '')
            return !inline && match ? (
              <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950 not-prose">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-900 border-b border-white/5">
                  <span className="text-xs font-mono font-medium text-slate-400">
                    {match[1]}
                  </span>
                  <CopyButton text={codeText} />
                </div>
                <pre className="px-4 py-3.5 text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  <code {...props}>{children}</code>
                </pre>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-white/10 not-prose">
                <table className="w-full text-sm text-left">{children}</table>
              </div>
            )
          },
          thead({ children }) {
            return (
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide">
                {children}
              </thead>
            )
          },
          th({ children }) {
            return <th className="px-4 py-3 font-semibold">{children}</th>
          },
          td({ children }) {
            return (
              <td className="px-4 py-3 border-t border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300">
                {children}
              </td>
            )
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-400 dark:border-blue-600 pl-4 my-2 text-slate-600 dark:text-slate-400 italic not-prose">
                {children}
              </blockquote>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-blue-500 rounded-sm animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  )
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
const ChatBubble = ({ msg, onRetry, isLast }) => {
  const isUser = msg.role === 'user'
  const isError = msg.isError

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white'
            : isError
            ? 'bg-rose-100 dark:bg-rose-950/50'
            : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
        }`}
      >
        {isUser ? (
          <span className="text-xs font-bold">You</span>
        ) : isError ? (
          <AlertTriangle size={14} className="text-rose-500" />
        ) : (
          <Brain size={14} className="text-white" />
        )}
      </div>

      <div
        className={`flex flex-col gap-1.5 ${
          isUser ? 'items-end max-w-[80%]' : 'items-start max-w-[85%] min-w-0'
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm leading-relaxed'
              : isError
              ? 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 rounded-tl-sm'
              : 'bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/[0.08] text-slate-800 dark:text-slate-100 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : isError ? (
            <div className="flex items-start gap-2">
              <p className="leading-relaxed">{msg.content}</p>
            </div>
          ) : (
            <MessageContent text={msg.content} isStreaming={msg.isStreaming} />
          )}
        </div>

        {/* Footer row */}
        <div className={`flex items-center gap-3 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          {msg.timestamp && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {msg.timestamp}
            </span>
          )}
          {isError && isLast && onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
            >
              <RotateCcw size={10} />
              Retry
            </button>
          )}
          {!isUser && !isError && !msg.isStreaming && (
            <CopyButton text={msg.content} />
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex gap-3">
    <div className="shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
      <Brain size={14} className="text-white" />
    </div>
    <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/[0.08] px-4 py-3 shadow-sm">
      <div className="flex gap-1.5 items-center h-5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-500"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
    </div>
  </div>
)

// ─── Empty / Welcome State ────────────────────────────────────────────────────
const WelcomeScreen = ({ onSendMessage, enrolledCourses, user }) => {
  const currentCourse = enrolledCourses?.[0] || null
  const courseTitle = getCourseTitle(currentCourse)

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-6"
      >
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/25">
          <Brain size={36} className="text-white" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md"
        >
          <Sparkles size={12} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-white mb-2">
          {user
            ? `Hello, ${user.firstName || 'there'}! 👋`
            : 'Hello! 👋'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md leading-relaxed">
          I'm your AI Tutor — ask me anything about your courses. I can explain
          concepts, generate quizzes, summarize lessons, write code examples, and
          much more.
        </p>
        {courseTitle && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 px-4 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            <BookOpen size={12} />
            Currently studying: {courseTitle}
          </div>
        )}
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl w-full"
      >
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = action.icon
          const styles = COLOR_MAP[action.color]
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ delay: 0.28 + i * 0.04 }}
              onClick={() => onSendMessage(action.buildPrompt(courseTitle))}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all shadow-sm hover:shadow-md ${styles.bg}`}
            >
              <Icon size={16} className={styles.icon} />
              <span className="text-sm font-semibold truncate">{action.label}</span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5"
      >
        <Lock size={10} />
        AI-generated responses may be inaccurate. Always verify critical
        information.
      </motion.p>
    </div>
  )
}

// ─── No API Key Banner ────────────────────────────────────────────────────────
const NoApiKeyBanner = () => (
  <div className="mx-4 mb-3">
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
      <div className="text-xs leading-relaxed">
        <span className="font-semibold text-amber-800 dark:text-amber-300">
          AI Tutor is not configured.{' '}
        </span>
        <span className="text-amber-700 dark:text-amber-400">
          Add{' '}
          <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
            VITE_GEMINI_API_KEY
          </code>{' '}
          to your{' '}
          <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
            .env
          </code>{' '}
          file to enable AI conversations.
        </span>
      </div>
    </div>
  </div>
)

// ─── Sidebar History Item ─────────────────────────────────────────────────────
const HistoryItem = ({ session, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-xl px-3 py-2.5 transition-all group ${
      isActive
        ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50'
        : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-transparent'
    }`}
  >
    <p
      className={`text-sm font-medium truncate ${
        isActive
          ? 'text-blue-700 dark:text-blue-300'
          : 'text-slate-700 dark:text-slate-300'
      }`}
    >
      {session.title}
    </p>
    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
      {session.preview}
    </p>
    <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">
      {session.time}
    </p>
  </button>
)

// ─── Main AITutor Component ───────────────────────────────────────────────────
const AITutor = () => {
  const { enrolledCourses, userData } = useContext(AppContext)
  const { user } = useUser()


  // ── Core chat state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Session / history (session-scoped, not persisted — no backend)
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const sessionCounter = useRef(0)

  // ── UI state
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0])
  const [modelOpen, setModelOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [attachments, setAttachments] = useState([])
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)

  // ── Refs
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const modelDropdownRef = useRef(null)
  const lastUserMessageRef = useRef(null)

  const currentCourse = enrolledCourses?.[0] || null
  const courseTitle = getCourseTitle(currentCourse)
  const hasApiKey = Boolean(GEMINI_API_KEY)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close model dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setModelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Ctrl+Enter shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSend()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isLoading])

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? input).trim()
      if (!text || isLoading) return
      if (!hasApiKey) {
        setError(
          'AI Tutor requires a VITE_GEMINI_API_KEY. Please configure your .env file.'
        )
        return
      }

      setError(null)
      lastUserMessageRef.current = text

      const userMsg = {
        id: `u_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: formatTime(),
      }

      const nextMessages = [...messages, userMsg]
      setMessages(nextMessages)
      setInput('')
      setAttachments([])
      setIsLoading(true)

      // Resize textarea
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }

      // Persist to session history
      if (!activeSessionId || messages.length === 0) {
        sessionCounter.current += 1
        const newId = `session_${sessionCounter.current}`
        setActiveSessionId(newId)
        setSessions((prev) => [
          {
            id: newId,
            title: text.length > 50 ? text.slice(0, 47) + '…' : text,
            preview: 'Just started',
            time: formatTime(),
            messages: nextMessages,
          },
          ...prev,
        ])
      }

      try {
        // Build the message history to send — include only user/assistant turns
        const historyForApi = nextMessages.filter(
          (m) => !m.isError && (m.role === 'user' || m.role === 'assistant')
        )

        const responseText = await callGeminiAPI(
          historyForApi,
          selectedModel.id
        )

        const assistantMsg = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: responseText,
          timestamp: formatTime(),
        }

        setMessages((prev) => {
          const updated = [...prev, assistantMsg]
          // Update session
          setSessions((sessions) =>
            sessions.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    preview:
                      responseText.slice(0, 60) + (responseText.length > 60 ? '…' : ''),
                    messages: updated,
                  }
                : s
            )
          )
          return updated
        })
      } catch (err) {
        const isNoKey = err.message === 'NO_API_KEY'
        const errMsg = isNoKey
          ? 'AI Tutor is not configured. Please add VITE_GEMINI_API_KEY to your .env file.'
          : `Something went wrong: ${err.message}. Please try again.`

        const errorMsg = {
          id: `e_${Date.now()}`,
          role: 'assistant',
          content: errMsg,
          isError: true,
          timestamp: formatTime(),
        }
        setMessages((prev) => [...prev, errorMsg])
        setError(errMsg)
      } finally {
        setIsLoading(false)
        inputRef.current?.focus()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, isLoading, messages, activeSessionId, selectedModel, hasApiKey]
  )

  // Retry last user message
  const handleRetry = useCallback(() => {
    if (!lastUserMessageRef.current) return
    // Remove last error message
    setMessages((prev) => {
      const withoutError = prev.filter((m) => !m.isError)
      // Also remove last user message — will be re-added by handleSend
      const withoutLast = withoutError.slice(0, -1)
      return withoutLast
    })
    setTimeout(() => handleSend(lastUserMessageRef.current), 50)
  }, [handleSend])

  // New chat
  const startNewChat = useCallback(() => {
    setMessages([])
    setActiveSessionId(null)
    setInput('')
    setAttachments([])
    setError(null)
    setMobileHistoryOpen(false)
    inputRef.current?.focus()
  }, [])

  // Load session
  const loadSession = useCallback((session) => {
    setMessages(session.messages)
    setActiveSessionId(session.id)
    setMobileHistoryOpen(false)
  }, [])

  // File attachment
  const handleFileAttach = (type) => {
    fileInputRef.current.accept =
      type === 'pdf'
        ? '.pdf'
        : type === 'image'
        ? 'image/*'
        : '.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.go,.rs,.rb,.php,.cs,.swift'
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > 10) {
        setError('File too large. Please upload files smaller than 10MB.')
        return
      }
      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          size:
            sizeMB >= 1
              ? `${sizeMB.toFixed(1)} MB`
              : `${(file.size / 1024).toFixed(0)} KB`,
          type: file.type,
        },
      ])
    }
    e.target.value = ''
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Sidebar left content ───────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
        <button
          onClick={startNewChat}
          className="flex items-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm shadow-blue-600/20 active:scale-[0.98]"
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {/* Session History */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageSquare size={28} className="text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              No conversations yet
            </p>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <>
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Recent
            </p>
            <div className="space-y-0.5">
              {sessions.map((session) => (
                <HistoryItem
                  key={session.id}
                  session={session}
                  isActive={activeSessionId === session.id}
                  onClick={() => loadSession(session)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Current Course Info */}
      {currentCourse && (
        <div className="shrink-0 p-3 border-t border-slate-100 dark:border-white/[0.06]">
          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
              Active Course
            </p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug">
              {courseTitle || 'Unnamed Course'}
            </p>
            {enrolledCourses.length > 1 && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                +{enrolledCourses.length - 1} more enrolled
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── LEFT SIDEBAR (desktop) ── */}
      <AnimatePresence initial={false}>
        {leftOpen && (
          <motion.aside
            key="left-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="hidden lg:flex shrink-0 flex-col border-r border-slate-200 dark:border-white/[0.07] bg-white dark:bg-slate-900/80 overflow-hidden"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MOBILE HISTORY DRAWER ── */}
      <AnimatePresence>
        {mobileHistoryOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileHistoryOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="lg:hidden fixed left-0 top-16 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/[0.07] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  Conversations
                </span>
                <button
                  onClick={() => setMobileHistoryOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SidebarContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── TOP BAR ── */}
        <div className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-slate-200 dark:border-white/[0.07] bg-white/90 dark:bg-slate-900/80 backdrop-blur-md z-10">

          {/* Left: sidebar toggle + mobile history */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLeftOpen((o) => !o)}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle sidebar"
            >
              <PanelLeft size={16} />
            </button>
            <button
              onClick={() => setMobileHistoryOpen(true)}
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 transition-colors relative"
              title="Chat history"
            >
              <PanelLeft size={16} />
              {sessions.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
              )}
            </button>
          </div>

          {/* Center: course context */}
          <div className="hidden sm:flex items-center gap-2 min-w-0 flex-1">
            {courseTitle ? (
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] px-3 py-1.5 min-w-0 max-w-xs">
                <BookOpen size={12} className="shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                  {courseTitle}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                No course selected
              </span>
            )}
          </div>

          <div className="flex-1 sm:flex-none" />

          {/* Right: model selector */}
          <div className="relative" ref={modelDropdownRef}>
            <button
              onClick={() => setModelOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              {React.createElement(selectedModel.icon, {
                size: 13,
                className: selectedModel.iconColor,
              })}
              <span className="hidden sm:inline">{selectedModel.name}</span>
              <motion.span
                animate={{ rotate: modelOpen ? 180 : 0 }}
                transition={{ duration: 0.18 }}
                className="text-slate-400"
              >
                <ChevronDown size={12} />
              </motion.span>
            </button>

            <AnimatePresence>
              {modelOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
                >
                  <div className="p-1">
                    {AI_MODELS.map((m) => {
                      const MIcon = m.icon
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedModel(m)
                            setModelOpen(false)
                          }}
                          className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors ${
                            selectedModel.id === m.id
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <MIcon size={15} className={m.iconColor} />
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-medium text-sm leading-none">
                              {m.name}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              {m.description}
                            </p>
                          </div>
                          {selectedModel.id === m.id && (
                            <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New chat (top bar shortcut) */}
          <button
            onClick={startNewChat}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 transition-colors"
            title="New chat"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* ── MESSAGES AREA ── */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen
              onSendMessage={handleSend}
              enrolledCourses={enrolledCourses}
              user={userData || user}
            />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
              {messages.map((msg, idx) => (
                <ChatBubble
                  key={msg.id}
                  msg={msg}
                  onRetry={handleRetry}
                  isLast={idx === messages.length - 1}
                />
              ))}

              {/* Typing indicator — only show when no streaming message exists */}
              {isLoading &&
                !messages.some((m) => m.isStreaming) && (
                  <TypingIndicator />
                )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── NO API KEY BANNER ── */}
        {!hasApiKey && <NoApiKeyBanner />}

        {/* ── INPUT AREA ── */}
        <div className="shrink-0 border-t border-slate-200 dark:border-white/[0.07] bg-white/90 dark:bg-slate-900/80 backdrop-blur-md px-3 sm:px-4 py-3">
          <div className="max-w-3xl mx-auto">

            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <Paperclip size={11} className="text-slate-400 shrink-0" />
                    <span className="font-medium truncate max-w-[120px]">
                      {att.name}
                    </span>
                    <span className="text-slate-400">{att.size}</span>
                    <button
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((_, j) => j !== i)
                        )
                      }
                      className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick action chips (when chat is active) */}
            {messages.length > 0 && !isLoading && (
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                {QUICK_ACTIONS.slice(0, 4).map((a) => {
                  const Icon = a.icon
                  const styles = COLOR_MAP[a.color]
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleSend(a.buildPrompt(courseTitle))}
                      className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${styles.bg}`}
                    >
                      <Icon size={11} className={styles.icon} />
                      {a.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Main input row */}
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 shadow-sm focus-within:border-blue-400 dark:focus-within:border-blue-600/60 focus-within:ring-2 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/10 transition-all px-3 py-2">

              {/* Attach buttons */}
              <div className="flex items-center gap-0.5 pb-0.5">
                <button
                  onClick={() => handleFileAttach('pdf')}
                  title="Attach PDF"
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                >
                  <FileText size={14} />
                </button>
                <button
                  onClick={() => handleFileAttach('image')}
                  title="Attach Image"
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                >
                  <ImageIcon size={14} />
                </button>
                <button
                  onClick={() => handleFileAttach('code')}
                  title="Attach Code File"
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  <Code2 size={14} />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasApiKey
                    ? 'Ask anything about your courses… (Enter to send, Shift+Enter for new line)'
                    : 'Configure VITE_GEMINI_API_KEY to start chatting…'
                }
                disabled={!hasApiKey}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none leading-6 py-1 max-h-40 overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '28px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 160) + 'px'
                }}
              />

              {/* Right actions */}
              <div className="flex items-center gap-0.5 pb-0.5">
                <button
                  title="Voice input (coming soon)"
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                >
                  <Mic size={14} />
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading || !hasApiKey}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm shadow-blue-600/25"
                  title="Send (Enter)"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-2">
              {selectedModel.name} · AI may make mistakes. Verify important
              information. ·{' '}
              <kbd className="font-mono">Enter</kbd> to send ·{' '}
              <kbd className="font-mono">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AITutor
