import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Play, Copy, MessageSquare, Bug, Zap, Activity, Terminal, Code2, CheckCircle2, AlertCircle, Cpu, X, Loader2, RotateCcw, Sparkles, ChevronRight } from 'lucide-react'
import { aiRequest } from '../../utils/aiClient'
import NoApiKeyState from '../../components/ai/NoApiKeyState'

const TOOLS = [
  { id: 'explain', label: 'Explain', icon: MessageSquare, title: 'Code Explanation' },
  { id: 'debug', label: 'Debug', icon: Bug, title: 'Debug Analysis' },
  { id: 'optimize', label: 'Optimize', icon: Zap, title: 'Optimization Suggestions' },
  { id: 'analyze', label: 'Analyze', icon: Activity, title: 'Complexity Analysis' },
]

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
]

const STARTER_CODE = {
  javascript: '',
  python: '',
  java: '',
  cpp: '',
  typescript: '',
  go: '',
  rust: '',
}

const ToolButton = ({ active, onClick, icon: Icon, label }) => (
  <div className="group relative flex items-center justify-center">
    <button onClick={onClick} className={`p-2 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-700 hover:text-gray-300'}`}>
      <Icon className="w-5 h-5" />
    </button>
    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
      {label}
    </span>
  </div>
)

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
              <p className="text-xs text-gray-600 mt-1">Backend AI service is working on it</p>
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
            <button onClick={onRetry} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-rose-900/30 border border-rose-700/40 text-rose-300 rounded-lg hover:bg-rose-900/50 transition-colors">
              <RotateCcw className="w-3 h-3" />
              Retry
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
              <p className="text-xs text-gray-600 mt-1">Paste your code and click <span className="text-blue-400 font-semibold">Analyze</span></p>
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

const AICodingAssistant = () => {
  const { getToken } = useAuth()
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [activeTool, setActiveTool] = useState('explain')
  const [output, setOutput] = useState('')
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const editorRef = useRef(null)
  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  useEffect(() => {
    setCode(STARTER_CODE[language] || '')
  }, [language])

  const runAnalysis = useCallback(async () => {
    if (!code.trim()) {
      setAnalysisError('Paste code before requesting an analysis.')
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
    } finally {
      setIsAnalyzing(false)
    }
  }, [activeTool, backendURL, code, getToken, language])

  const handleToolChange = (toolId) => {
    setActiveTool(toolId)
    setAnalysisResult(null)
    setAnalysisError(null)
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleRunCode = useCallback(async () => {
    setIsTerminalOpen(true)
    setIsRunning(true)
    setOutput('> Running…')

    try {
      const { data } = await aiRequest({
        backendURL,
        getToken,
        path: '/api/ai/coding/run',
        data: { code, language },
        retries: 1,
      })
      setOutput(data.output)
    } catch (err) {
      setOutput(`> Error: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }, [backendURL, code, getToken, language])

  const lineCount = Math.max((code.match(/\n/g) || []).length + 1, 10)

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-[#1e1e1e] text-[#d4d4d4] flex overflow-hidden font-mono">
      <div className="w-16 bg-[#252526] flex flex-col items-center py-6 gap-4 border-r border-black/20 shrink-0">
        <div className="mb-2 p-2 bg-blue-600 rounded-lg text-white"><Code2 className="w-6 h-6" /></div>
        {TOOLS.map((tool) => <ToolButton key={tool.id} active={activeTool === tool.id} onClick={() => handleToolChange(tool.id)} icon={tool.icon} label={tool.label} />)}
        <div className="w-8 border-t border-gray-700 mt-2" />
        <div className="group relative flex items-center justify-center">
          <button onClick={runAnalysis} disabled={isAnalyzing} className="p-2 rounded-lg transition-all bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/40" title="Run AI Analysis">
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Analyze</span>
        </div>
      </div>

      <div className="flex-grow flex flex-col bg-[#1e1e1e] min-w-0">
        <div className="h-11 bg-[#2d2d2d] flex items-center justify-between px-4 border-b border-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500"><ChevronRight className="w-3 h-3" /><span>editor</span><span className="text-gray-600">/</span><span className="text-gray-400">main.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'python' ? 'py' : language === 'typescript' ? 'ts' : language === 'go' ? 'go' : language === 'rust' ? 'rs' : 'js'}</span></div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-[#3c3c3c] text-xs text-gray-300 border-none rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleCopyCode} className="flex items-center gap-1.5 px-3 py-1 text-xs bg-transparent hover:bg-[#3c3c3c] text-gray-400 hover:text-gray-200 rounded transition-all">
              {isCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => setIsTerminalOpen((o) => !o)} className="flex items-center gap-1.5 px-3 py-1 text-xs bg-transparent hover:bg-[#3c3c3c] text-gray-400 hover:text-gray-200 rounded transition-all">
              <Terminal className="w-3 h-3" />
              Terminal
            </button>
            <button onClick={handleRunCode} disabled={isRunning || !code.trim()} className="flex items-center gap-1.5 px-3 py-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {isRunning ? 'Running…' : 'Run'}
            </button>
            <button onClick={runAnalysis} disabled={isAnalyzing || !code.trim()} className="flex items-center gap-1.5 px-3 py-1 text-xs bg-[#007acc] hover:bg-[#0062a3] text-white rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isAnalyzing ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>

        <div className="flex-grow flex overflow-hidden">
          <div className="w-12 bg-[#1e1e1e] text-right pr-3 pt-4 text-xs text-gray-600 select-none border-r border-black/10 overflow-hidden">
            {Array.from({ length: lineCount }).map((_, i) => <div key={i} className="h-[21px] leading-[21px]">{i + 1}</div>)}
          </div>

          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-grow p-4 text-sm leading-[21px] outline-none bg-[#1e1e1e] text-[#d4d4d4] font-mono resize-none overflow-auto"
            placeholder="Paste or type your code here, then analyze or run it"
            style={{ tabSize: 2 }}
          />
        </div>

        <div className={`transition-all duration-300 ease-in-out bg-[#1e1e1e] border-t border-black/20 shrink-0 ${isTerminalOpen ? 'h-36' : 'h-0 overflow-hidden'}`}>
          <div className="h-8 bg-[#252526] flex items-center justify-between px-4 border-b border-black/20">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400"><Terminal className="w-3 h-3" /><span>Terminal</span></div>
            <button onClick={() => setIsTerminalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-3 h-3" /></button>
          </div>
          <div className="p-3 text-xs font-mono text-gray-400 overflow-auto h-[calc(100%-32px)] whitespace-pre-wrap">
            {output || '> Ready. Click "Run" to execute your code, or "Analyze" for AI-powered insights.'}
          </div>
        </div>
      </div>

      <AiResultPanel result={analysisResult} loading={isAnalyzing} error={analysisError} activeTool={activeTool} onRetry={runAnalysis} />
    </div>
  )
}

export default AICodingAssistant
