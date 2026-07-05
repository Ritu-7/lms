import React, { useState, useRef, useEffect, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext } from '../../context/AppContext'

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const AI_MODELS = [
  { id: 'learnos-v2', name: 'LearnOS v2', description: 'Fast & smart', icon: '⚡' },
  { id: 'learnos-pro', name: 'LearnOS Pro', description: 'Deep reasoning', icon: '🧠' },
  { id: 'learnos-code', name: 'LearnOS Code', description: 'Best for code', icon: '💻' },
]

const QUICK_ACTIONS = [
  { id: 'explain', label: 'Explain Topic', icon: '💡', color: 'blue', prompt: 'Please explain the current topic in simple, beginner-friendly terms with examples.' },
  { id: 'summarize', label: 'Summarize Lesson', icon: '📋', color: 'purple', prompt: 'Please give me a concise summary of this lesson with the key points.' },
  { id: 'quiz', label: 'Generate Quiz', icon: '❓', color: 'emerald', prompt: 'Generate a 5-question multiple choice quiz to test my understanding of this lesson.' },
  { id: 'flashcards', label: 'Create Flashcards', icon: '🃏', color: 'amber', prompt: 'Create 8 flashcards (question & answer pairs) from this lesson.' },
  { id: 'notes', label: 'Generate Notes', icon: '📝', color: 'rose', prompt: 'Create structured study notes from this lesson in markdown format.' },
  { id: 'code', label: 'Explain Code', icon: '🔍', color: 'indigo', prompt: 'Explain the code in this lesson step by step, including what each line does.' },
]

const SAMPLE_HISTORY = [
  { id: 'h1', title: 'React useEffect deep dive', time: '2h ago', preview: 'Explained dependency array behavior...' },
  { id: 'h2', title: 'Binary search algorithm', time: '1d ago', preview: 'Step-by-step walkthrough with examples...' },
  { id: 'h3', title: 'CSS Grid vs Flexbox', time: '2d ago', preview: 'Comparison with visual examples...' },
  { id: 'h4', title: 'Async/Await patterns', time: '3d ago', preview: 'Error handling and best practices...' },
  { id: 'h5', title: 'Machine Learning basics', time: '5d ago', preview: 'Introduction to supervised learning...' },
]

const SAMPLE_RESOURCES = [
  { title: 'Lesson Slides', type: 'pdf', size: '2.4 MB' },
  { title: 'Code Examples', type: 'code', size: '14 KB' },
  { title: 'Cheatsheet', type: 'pdf', size: '512 KB' },
]

const RELATED_LESSONS = [
  { title: 'Advanced Hooks Patterns', duration: '18 min', progress: 0 },
  { title: 'Custom Hook Design', duration: '22 min', progress: 0 },
  { title: 'Performance Optimization', duration: '31 min', progress: 0 },
]

/* ─────────────────────────────────────────────────────────
   HELPER: Simulate streaming text word by word
───────────────────────────────────────────────────────── */
const DEMO_RESPONSE = `Great question! Let me explain **React's useEffect hook** in depth.

## What is useEffect?

\`useEffect\` is a React Hook that lets you synchronize a component with an external system — like a network request, browser DOM, or timer.

\`\`\`javascript
useEffect(() => {
  // Side effect runs after render
  const subscription = props.source.subscribe();

  // Optional cleanup
  return () => {
    subscription.unsubscribe();
  };
}, [props.source]); // Dependency array
\`\`\`

## Key Rules

| Dependency Array | Behavior |
|---|---|
| \`[]\` | Run once after first render |
| \`[dep]\` | Run when \`dep\` changes |
| *(omitted)* | Run after every render |

## Common Use Cases

1. **Fetching data** from an API on component mount
2. **Setting up subscriptions** (WebSockets, event listeners)
3. **Updating document title** or meta tags
4. **Timers** — \`setTimeout\` / \`setInterval\`

> 💡 **Pro tip:** Always include every value used inside the effect in the dependency array. ESLint's \`react-hooks/exhaustive-deps\` rule helps catch these.

Would you like me to show more examples or generate a quiz on this topic?`

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────── */

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

/** Renders a chat message with robust markdown/math support */
const MessageContent = ({ text, isStreaming }) => {
  return (
    <div className="prose prose-sm max-w-none prose-slate prose-headings:font-bold prose-a:text-blue-600 prose-code:text-blue-600 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <div className="my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-950">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-white/5">
                  <span className="text-xs font-mono text-slate-400">{match[1]}</span>
                </div>
                <pre className="px-4 py-3 text-sm font-mono text-green-300 overflow-x-auto leading-relaxed">
                  <code {...props}>{children}</code>
                </pre>
              </div>
            ) : (
              <code className={className} {...props}>{children}</code>
            )
          }
        }}
      >
        {text}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-blue-500 rounded-sm animate-pulse ml-0.5" />
      )}
    </div>
  )
}

/** Single chat bubble */
const ChatBubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-md ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
      }`}>
        {isUser ? '👤' : '🤖'}
      </div>

      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-5 py-3.5 text-sm shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm'
        }`}>
          {isUser ? (
            <p className="leading-6">{msg.content}</p>
          ) : (
            <MessageContent text={msg.content} isStreaming={msg.isStreaming} />
          )}
        </div>
        {msg.timestamp && (
          <span className="text-[10px] text-slate-400 px-1">{msg.timestamp}</span>
        )}
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
const AITutor = () => {
  const { enrolledCourses } = useContext(AppContext)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0])
  const [modelOpen, setModelOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [activeChat, setActiveChat] = useState(null)
  const [credits, setCredits] = useState(48)
  const [attachments, setAttachments] = useState([])

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input
  useEffect(() => { inputRef.current?.focus() }, [])

  // Current enrolled course (first one)
  const currentCourse = enrolledCourses?.[0] || null

  /* Simulate streaming AI response */
  const simulateStream = useCallback((fullText) => {
    const words = fullText.split(' ')
    let idx = 0
    const msgId = Date.now()

    setMessages(prev => [...prev, {
      id: msgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])

    const timer = setInterval(() => {
      idx += 2
      const chunk = words.slice(0, idx).join(' ')
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: chunk, isStreaming: idx < words.length } : m
      ))
      if (idx >= words.length) {
        clearInterval(timer)
        setIsTyping(false)
        setCredits(c => Math.max(0, c - 1))
      }
    }, 35)
  }, [])

  const sendMessage = useCallback((text = input) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setAttachments([])
    setIsTyping(true)

    // Simulate delay then stream
    setTimeout(() => simulateStream(DEMO_RESPONSE), 800)
  }, [input, isTyping, simulateStream])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFileAttach = (type) => {
    fileInputRef.current.accept = type === 'pdf' ? '.pdf' : type === 'image' ? 'image/*' : '.js,.ts,.py,.java,.cpp,.c'
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttachments(prev => [...prev, { name: file.name, size: (file.size / 1024).toFixed(0) + ' KB', type: file.type }])
    }
    e.target.value = ''
  }

  const startNewChat = () => {
    setMessages([])
    setActiveChat(null)
    setInput('')
    inputRef.current?.focus()
  }

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden font-['Outfit']">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      {/* ────── LEFT SIDEBAR ────── */}
      <AnimatePresence initial={false}>
        {leftOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* New Chat */}
              <div className="p-3 border-b border-slate-100">
                <button
                  onClick={startNewChat}
                  className="flex items-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm shadow-blue-600/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Chat
                </button>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Today</p>

                {SAMPLE_HISTORY.slice(0, 2).map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat.id)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors group ${
                      activeChat === chat.id
                        ? 'bg-blue-50 border border-blue-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className={`text-sm font-medium truncate ${activeChat === chat.id ? 'text-blue-700' : 'text-slate-700'}`}>
                      {chat.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{chat.preview}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">{chat.time}</p>
                  </button>
                ))}

                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-2">Earlier</p>

                {SAMPLE_HISTORY.slice(2).map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat.id)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                      activeChat === chat.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className={`text-sm font-medium truncate ${activeChat === chat.id ? 'text-blue-700' : 'text-slate-700'}`}>
                      {chat.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{chat.preview}</p>
                  </button>
                ))}
              </div>

              {/* Saved */}
              <div className="p-3 border-t border-slate-100">
                <button className="flex items-center gap-2 w-full rounded-xl hover:bg-slate-50 px-3 py-2 text-sm text-slate-600 transition-colors">
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Saved Conversations
                  <span className="ml-auto text-xs bg-amber-100 text-amber-600 font-semibold px-1.5 py-0.5 rounded-full">3</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ────── MAIN AREA ────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── TOP BAR ── */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 bg-white/80 backdrop-blur-md z-10">
          {/* Sidebar toggle */}
          <button
            onClick={() => setLeftOpen(o => !o)}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Course/Lesson info */}
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5">
              <span className="text-xs text-slate-400 shrink-0">Course:</span>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
                {currentCourse?.courseData?.courseTitle || 'No course selected'}
              </span>
            </div>
            <svg className="h-3.5 w-3.5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5">
              <span className="text-xs text-slate-400 shrink-0">Lesson:</span>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                {currentCourse ? 'Current Lesson' : '—'}
              </span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Credits */}
          <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${
            credits > 20 ? 'bg-emerald-50 text-emerald-700' : credits > 5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
          }`}>
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
            </svg>
            {credits} credits
          </div>

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setModelOpen(o => !o)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>{selectedModel.icon}</span>
              <span className="hidden sm:inline">{selectedModel.name}</span>
              <svg className={`h-3 w-3 text-slate-400 transition-transform ${modelOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {modelOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                >
                  {AI_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m); setModelOpen(false) }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${selectedModel.id === m.id ? 'text-blue-600' : 'text-slate-700'}`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <div className="text-left">
                        <p className="font-medium text-sm">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.description}</p>
                      </div>
                      {selectedModel.id === m.id && (
                        <svg className="h-4 w-4 text-blue-600 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right sidebar toggle */}
          <button
            onClick={() => setRightOpen(o => !o)}
            className="hidden xl:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>

        {/* ── MESSAGES AREA ── */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="mb-6 relative"
              >
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/30">
                  🤖
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">AI</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.35 }}
              >
                <h1 className="text-2xl font-bold text-slate-800 mb-2">LearnOS AI Tutor</h1>
                <p className="text-slate-500 text-sm max-w-md mb-8 leading-6">
                  Ask me anything about your courses. I can explain concepts, generate quizzes, summarize lessons, write code examples, and more.
                </p>
              </motion.div>

              {/* Quick actions */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.35 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl w-full"
              >
                {QUICK_ACTIONS.map((action, i) => {
                  const colorMap = {
                    blue: 'border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-700',
                    purple: 'border-purple-100 bg-purple-50 hover:bg-purple-100 text-purple-700',
                    emerald: 'border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
                    amber: 'border-amber-100 bg-amber-50 hover:bg-amber-100 text-amber-700',
                    rose: 'border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-700',
                    indigo: 'border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
                  }
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.1 } }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      onClick={() => sendMessage(action.prompt)}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors shadow-sm hover:shadow-md ${colorMap[action.color]}`}
                    >
                      <span className="text-xl">{action.icon}</span>
                      <span className="text-sm font-semibold">{action.label}</span>
                    </motion.button>
                  )
                })}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 text-xs text-slate-400 flex items-center gap-1"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Responses are AI-generated. Always verify critical information.
              </motion.p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map(msg => (
                <ChatBubble key={msg.id} msg={msg} />
              ))}
              {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm shrink-0">🤖</div>
                  <div className="rounded-2xl rounded-tl-sm bg-white border border-slate-100 px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5 items-center h-5">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-blue-400"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── BOTTOM INPUT ── */}
        <div className="shrink-0 border-t border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3">
          <div className="max-w-3xl mx-auto">
            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                    <span>📎</span>
                    <span className="font-medium truncate max-w-[120px]">{att.name}</span>
                    <span className="text-slate-400">{att.size}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick action chips (when chat is active) */}
            {messages.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                {QUICK_ACTIONS.slice(0, 4).map(a => (
                  <button
                    key={a.id}
                    onClick={() => sendMessage(a.prompt)}
                    className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors"
                  >
                    <span>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* Main input row */}
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all px-3 py-2">
              {/* Attach buttons */}
              <div className="flex items-center gap-1 pb-0.5">
                <button
                  onClick={() => handleFileAttach('pdf')}
                  title="Upload PDF"
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleFileAttach('image')}
                  title="Upload Image"
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleFileAttach('code')}
                  title="Upload Code"
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </button>
              </div>

              {/* Text area */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your course… (Shift+Enter for new line)"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none leading-6 py-1.5 max-h-40 overflow-y-auto"
                style={{ minHeight: '36px' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                }}
              />

              {/* Right actions */}
              <div className="flex items-center gap-1 pb-0.5">
                {/* Voice */}
                <button
                  title="Voice input"
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>

                {/* Send */}
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-300 mt-2">
              LearnOS AI may make mistakes. Check important info. · {selectedModel.name}
            </p>
          </div>
        </div>
      </div>

      {/* ────── RIGHT SIDEBAR ────── */}
      <AnimatePresence initial={false}>
        {rightOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="hidden xl:flex shrink-0 flex-col border-l border-slate-200 bg-white overflow-hidden"
          >
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Resources */}
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Lesson Resources</h3>
                <div className="space-y-2">
                  {SAMPLE_RESOURCES.map((res, i) => (
                    <button
                      key={i}
                      className="flex items-center gap-3 w-full rounded-xl hover:bg-slate-50 px-3 py-2.5 transition-colors group text-left"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        res.type === 'pdf' ? 'bg-red-50 text-red-500' : res.type === 'code' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'
                      }`}>
                        {res.type === 'pdf' ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">{res.title}</p>
                        <p className="text-xs text-slate-400">{res.size}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">AI Suggestions</h3>
                <div className="space-y-2">
                  {[
                    { text: 'Review the dependency array rules', icon: '💡' },
                    { text: 'Practice with a custom hook exercise', icon: '🎯' },
                    { text: 'Compare with class lifecycle methods', icon: '🔄' },
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-start gap-2 w-full rounded-xl bg-blue-50 hover:bg-blue-100 px-3 py-2.5 text-left transition-colors"
                    >
                      <span className="text-sm shrink-0">{s.icon}</span>
                      <p className="text-xs text-blue-700 font-medium leading-5">{s.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Related Lessons */}
              <div className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Related Lessons</h3>
                <div className="space-y-2">
                  {RELATED_LESSONS.map((lesson, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/50 px-3 py-2.5 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors leading-tight">{lesson.title}</p>
                        <svg className="h-4 w-4 text-slate-300 group-hover:text-blue-500 shrink-0 mt-0.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-slate-400">{lesson.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AITutor
