import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'react-toastify'
import {
  Play, Copy, MessageSquare, Bug, Zap, Activity, Terminal, Code2,
  CheckCircle2, AlertCircle, Cpu, X, Loader2, RotateCcw, Sparkles,
  ChevronRight, Check, Clock, AlertTriangle,
} from 'lucide-react'
import { aiRequest } from '../../utils/aiClient'
import NoApiKeyState from '../../components/ai/NoApiKeyState'

// ─── Constants ────────────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'explain',  label: 'Explain',  icon: MessageSquare, title: 'Code Explanation' },
  { id: 'debug',    label: 'Debug',    icon: Bug,           title: 'Debug Analysis' },
  { id: 'optimize', label: 'Optimize', icon: Zap,           title: 'Optimization Suggestions' },
  { id: 'analyze',  label: 'Analyze',  icon: Activity,      title: 'Complexity Analysis' },
]

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', ext: 'js' },
  { value: 'python',     label: 'Python',     ext: 'py' },
  { value: 'java',       label: 'Java',       ext: 'java' },
  { value: 'cpp',        label: 'C++',        ext: 'cpp' },
  { value: 'typescript', label: 'TypeScript', ext: 'ts' },
  { value: 'go',         label: 'Go',         ext: 'go' },
  { value: 'rust',       label: 'Rust',       ext: 'rs' },
]

const getExt = (lang) => LANGUAGES.find((l) => l.value === lang)?.ext || 'txt'

// ─── Terminal Output Line ─────────────────────────────────────────────────────
// Renders a single line with appropriate colour based on its prefix
const TerminalLine = ({ line }) => {
  if (!line) return <span>&nbsp;</span>
  if (line.startsWith('[error]') || line.startsWith('[stderr]') || line.startsWith('[compile error]')) {
    return <span className="text-rose-400">{line}</span>
  }
  if (line.startsWith('[info]') || line.startsWith('[signal]') || line.startsWith('[exit code')) {
    return <span className="text-yellow-400">{line}</span>
  }
  if (line.startsWith('$') || line.startsWith('>')) {
    return <span className="text-emerald-400">{line}</span>
  }
  return <span className="text-gray-300">{line}</span>
}

// ─── Tool Button ──────────────────────────────────────────────────────────────
const ToolButton = ({ active, onClick, icon: Icon, label }) => (
  <div className="group relative flex items-center justify-center">
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all ${active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
        : 'text-gray-500 hover:bg-gray-700 hover:text-gray-300'}`}
    >
      <Icon className="w-5 h-5" />
    </button>
    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
      {label}
    </span>
  </div>
)

// ─── AI Result Panel ──────────────────────────────────────────────────────────
const AiResultPanel = ({ result, loading, error, activeTool, onRetry }) => {
  const tool = TOOLS.find((t) => t.id === activeTool)

  return (
    <div className="w-80 bg-[#252526] border-l border-black/20 flex flex-col">
      <div className="p-4 border-b border-black/20 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          {tool?.title || 'AI Analysis'}
        </h2>
        {!loading && result && (
          <button onClick={onRetry} className="text-gray-500 hover:text-gray-300 transition-colors" title="Re-analyze">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-grow p-4 overflow-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <Loader2 className="absolute -bottom-1 -right-1 w-5 h-5 text-blue-400 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">Analyzing your code…</p>
              <p className="text-xs text-gray-600 mt-1">AI service is working on it</p>
            </div>
          </div>
        )}

        {error && !loading && (
          error.isNoKey ? (
            <NoApiKeyState />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="h-10 w-10 rounded-xl bg-rose-900/30 border border-rose-700/40 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-300">Analysis failed</p>
                <p className="text-xs text-gray-600 mt-1 max-w-[200px]">{error.message}</p>
              </div>
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-rose-900/30 border border-rose-700/40 text-rose-300 rounded-lg hover:bg-rose-900/50 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            </div>
          )
        )}

        {!loading && !error && !result && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-blue-900/30 border border-blue-700/40 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-400">No analysis yet</p>
              <p className="text-xs text-gray-600 mt-1">
                Paste your code and click <span className="text-blue-400 font-semibold">Analyze</span>
              </p>
            </div>
          </div>
        )}

        {!loading && !error && result && (
          <div className="prose prose-sm prose-invert max-w-none prose-headings:font-bold prose-code:text-emerald-300 prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AICodingAssistant = () => {
  const { getToken } = useAuth()
  const [code, setCode]                   = useState('')
  const [language, setLanguage]           = useState('javascript')
  const [activeTool, setActiveTool]       = useState('explain')
  const [terminalLines, setTerminalLines] = useState([])  // array of strings per line
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [isCopied, setIsCopied]           = useState(false)
  const [isRunning, setIsRunning]         = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError]   = useState(null)
  const [isAnalyzing, setIsAnalyzing]     = useState(false)
  const editorRef    = useRef(null)
  const terminalRef  = useRef(null)
  const backendURL   = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  // Auto-scroll terminal to bottom whenever lines change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalLines])

  // Reset code when language changes (blank slate)
  useEffect(() => {
    setCode('')
  }, [language])

  // ── Run Code ──────────────────────────────────────────────────────────────
  const handleRunCode = useCallback(async () => {
    if (!code.trim()) {
      toast.warn('Write some code before running.')
      return
    }

    setIsTerminalOpen(true)
    setIsRunning(true)
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setTerminalLines([
      `$ Running ${language} · ${timestamp}`,
      '',
    ])

    try {
      const { data } = await aiRequest({
        backendURL,
        getToken,
        path: '/api/ai/coding/run',
        data: { code, language },
        retries: 1,
      })

      const rawOutput = data?.output ?? ''

      // Split output into labelled lines for the terminal renderer
      const outputLines = rawOutput.split('\n')
      const hasError = rawOutput.includes('[stderr]') || rawOutput.includes('[compile error]') || rawOutput.includes('[error]')

      setTerminalLines([
        `$ Running ${language} · ${timestamp}`,
        '',
        ...outputLines,
        '',
        hasError
          ? '[info] Process finished with errors'
          : '[info] Process finished successfully',
      ])

      if (hasError) {
        toast.error('Code ran with errors — check the terminal')
      }
    } catch (err) {
      const msg = err.message || 'Execution failed'
      setTerminalLines((prev) => [
        ...prev,
        `[error] ${msg}`,
        '',
        '[info] Process terminated',
      ])
      toast.error(`Run failed: ${msg}`)
    } finally {
      setIsRunning(false)
    }
  }, [backendURL, code, getToken, language])

  // ── AI Analysis ───────────────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!code.trim()) {
      toast.warn('Paste some code before requesting an analysis.')
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisResult(null)

    try {
      const { data } = await aiRequest({
        backendURL,
        getToken,
        path: '/api/ai/coding/analyze',
        data: { code, language, tool: activeTool },
        retries: 1,
      })
      setAnalysisResult(data.analysis)
    } catch (err) {
      setAnalysisError({ message: err.message, isNoKey: err.statusCode === 403 })
      if (err.statusCode !== 403) {
        toast.error(`Analysis failed: ${err.message}`)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }, [activeTool, backendURL, code, getToken, language])

  // ── Tool Switch ───────────────────────────────────────────────────────────
  const handleToolChange = (toolId) => {
    setActiveTool(toolId)
    setAnalysisResult(null)
    setAnalysisError(null)
  }

  // ── Copy Code ─────────────────────────────────────────────────────────────
  const handleCopyCode = async () => {
    if (!code.trim()) return
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      toast.success('Code copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('Failed to copy code')
    }
  }

  // ── Clear Terminal ────────────────────────────────────────────────────────
  const clearTerminal = () => setTerminalLines([])

  const lineCount = Math.max((code.match(/\n/g) || []).length + 1, 10)
  const ext = getExt(language)

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-[#1e1e1e] text-[#d4d4d4] flex overflow-hidden font-mono">
      {/* ── Sidebar Tool Strip ── */}
      <div className="w-16 bg-[#252526] flex flex-col items-center py-6 gap-4 border-r border-black/20 shrink-0">
        <div className="mb-2 p-2 bg-blue-600 rounded-lg text-white">
          <Code2 className="w-6 h-6" />
        </div>
        {TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            active={activeTool === tool.id}
            onClick={() => handleToolChange(tool.id)}
            icon={tool.icon}
            label={tool.label}
          />
        ))}
        <div className="w-8 border-t border-gray-700 mt-2" />
        {/* Quick Analyze button in sidebar */}
        <div className="group relative flex items-center justify-center">
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="p-2 rounded-lg transition-all bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/40"
            title="Run AI Analysis"
          >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            Analyze
          </span>
        </div>
      </div>

      {/* ── Main Editor Column ── */}
      <div className="flex-grow flex flex-col bg-[#1e1e1e] min-w-0">

        {/* ── Top Bar ── */}
        <div className="h-11 bg-[#2d2d2d] flex items-center justify-between px-4 border-b border-black/20 shrink-0">
          {/* Left: breadcrumb + language selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <ChevronRight className="w-3 h-3" />
              <span>editor</span>
              <span className="text-gray-600">/</span>
              <span className="text-gray-400">main.{ext}</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#3c3c3c] text-xs text-gray-300 border-none rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-transparent hover:bg-[#3c3c3c] text-gray-400 hover:text-gray-200 rounded transition-all"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {isCopied ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={() => setIsTerminalOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-transparent hover:bg-[#3c3c3c] text-gray-400 hover:text-gray-200 rounded transition-all"
            >
              <Terminal className="w-3 h-3" />
              Terminal
            </button>

            <button
              onClick={handleRunCode}
              disabled={isRunning || !code.trim()}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {isRunning ? 'Running…' : 'Run'}
            </button>

            <button
              onClick={runAnalysis}
              disabled={isAnalyzing || !code.trim()}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-[#007acc] hover:bg-[#0062a3] text-white rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isAnalyzing ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>

        {/* ── Editor + line numbers ── */}
        <div className="flex-grow flex overflow-hidden">
          {/* Line numbers */}
          <div className="w-12 bg-[#1e1e1e] text-right pr-3 pt-4 text-xs text-gray-600 select-none border-r border-black/10 overflow-hidden">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="h-[21px] leading-[21px]">{i + 1}</div>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-grow p-4 text-sm leading-[21px] outline-none bg-[#1e1e1e] text-[#d4d4d4] font-mono resize-none overflow-auto"
            placeholder={`Paste or type your ${LANGUAGES.find(l => l.value === language)?.label || ''} code here, then click Run or Analyze`}
            style={{ tabSize: 2 }}
          />
        </div>

        {/* ── Terminal Panel ── */}
        <div
          className={`transition-all duration-300 ease-in-out bg-[#0d0d0d] border-t border-black/40 shrink-0 ${
            isTerminalOpen ? 'h-52' : 'h-0 overflow-hidden'
          }`}
        >
          {/* Terminal header */}
          <div className="h-8 bg-[#252526] flex items-center justify-between px-4 border-b border-black/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <Terminal className="w-3 h-3" />
                <span>Terminal</span>
              </div>
              {isRunning && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Running…
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {terminalLines.length > 0 && (
                <button
                  onClick={clearTerminal}
                  className="text-gray-600 hover:text-gray-400 text-[10px] transition-colors"
                  title="Clear terminal"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsTerminalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Terminal body */}
          <div
            ref={terminalRef}
            className="p-3 text-xs font-mono overflow-auto h-[calc(100%-32px)]"
          >
            {terminalLines.length === 0 ? (
              <span className="text-gray-600">
                {`> Ready. Click "Run" to execute your code, or "Analyze" for AI-powered insights.`}
              </span>
            ) : (
              terminalLines.map((line, i) => (
                <div key={i} className="leading-5">
                  <TerminalLine line={line} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── AI Analysis Panel ── */}
      <AiResultPanel
        result={analysisResult}
        loading={isAnalyzing}
        error={analysisError}
        activeTool={activeTool}
        onRetry={runAnalysis}
      />
    </div>
  )
}

export default AICodingAssistant
