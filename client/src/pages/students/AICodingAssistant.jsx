import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Copy, 
  MessageSquare, 
  Bug, 
  Zap, 
  Activity, 
  ChevronRight, 
  ChevronDown, 
  Terminal, 
  Code2, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu,
  X
} from 'lucide-react';

const AICodingAssistant = () => {
  const [code, setCode] = useState(`function findMax(arr) {
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}`);
  const [language, setLanguage] = useState('javascript');
  const [activeTool, setActiveTool] = useState('explain');
  const [output, setOutput] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  // --- AI Insights Data ---
  const aiInsights = {
    explain: {
      title: 'Code Explanation',
      content: [
        { 
          step: 1, 
          text: 'Initialize a variable "max" with the first element of the array to serve as the baseline for comparison.' 
        },
        { 
          step: 2, 
          text: 'Iterate through the array starting from the second element (index 1) using a for-loop.' 
        },
        { 
          step: 3, 
          text: 'Inside the loop, compare the current element with "max". If the current element is larger, update "max".' 
        },
        { 
          step: 4, 
          text: 'Once the loop completes, return the final value of "max", which is the largest element in the array.' 
        },
      ],
    },
    debug: {
      title: 'Debug Analysis',
      status: 'No critical errors found',
      suggestions: [
        { 
          issue: 'Potential Edge Case', 
          text: 'The function will crash if an empty array is passed. Consider adding a check for arr.length === 0.', 
          severity: 'warning' 
        },
      ],
    },
    optimize: {
      title: 'Optimization Suggestions',
      original: 'Iterative approach using a for-loop.',
      optimized: `function findMax(arr) {
  if (!arr || arr.length === 0) return null;
  return Math.max(...arr);
}`,
      benefit: 'Improved readability and leverages built-in JavaScript methods for better performance on small to medium arrays.',
    },
    analyze: {
      title: 'Complexity Analysis',
      metrics: {
        time: 'O(n)',
        space: 'O(1)',
        description: 'Linear time complexity because we visit each element of the array exactly once. Constant space complexity as we only use one variable regardless of input size.'
      }
    }
  };

  const handleRunCode = () => {
    setOutput(`Executing code...
> Result: 10
> Execution time: 12ms
> Status: Success`);
    setIsTerminalOpen(true);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="h-screen w-full bg-[#1e1e1e] text-[#d4d4d4] flex overflow-hidden font-mono">
      
      {/* Tool Rail (Left) */}
      <div className="w-16 bg-[#252526] flex flex-col items-center py-6 gap-6 border-r border-black/20">
        <div className="mb-4 p-2 bg-blue-600 rounded-lg text-white">
          <Code2 className="w-6 h-6" />
        </div>
        
        <ToolButton 
          active={activeTool === 'explain'} 
          onClick={() => setActiveTool('explain')} 
          icon={<MessageSquare className="w-5 h-5" />} 
          label="Explain" 
        />
        <ToolButton 
          active={activeTool === 'debug'} 
          onClick={() => setActiveTool('debug')} 
          icon={<Bug className="w-5 h-5" />} 
          label="Debug" 
        />
        <ToolButton 
          active={activeTool === 'optimize'} 
          onClick={() => setActiveTool('optimize')} 
          icon={<Zap className="w-5 h-5" />} 
          label="Optimize" 
        />
        <ToolButton 
          active={activeTool === 'analyze'} 
          onClick={() => setActiveTool('analyze')} 
          icon={<Activity className="w-5 h-5" />} 
          label="Analyze" 
        />
      </div>

      {/* Editor Workspace (Center) */}
      <div className="flex-grow flex flex-col bg-[#1e1e1e]">
        {/* Control Bar */}
        <div className="h-12 bg-[#2d2d2d] flex items-center justify-between px-4 border-b border-black/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ChevronRight className="w-3 h-3" />
              <span>src / utils / helpers.js</span>
            </div>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#3c3c3c] text-xs text-gray-300 border-none rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3 py-1 text-xs bg-transparent hover:bg-[#3c3c3c] text-gray-300 rounded transition-all"
            >
              {isCopied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
            <button 
              onClick={handleRunCode}
              className="flex items-center gap-2 px-3 py-1 text-xs bg-[#007acc] hover:bg-[#0062a3] text-white rounded transition-all"
            >
              <Play className="w-3 h-3" />
              Run
            </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-grow flex overflow-hidden">
          {/* Line Numbers */}
          <div className="w-12 bg-[#1e1e1e] text-right pr-3 py-4 text-xs text-gray-600 select-none border-r border-black/10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-6">{i + 1}</div>
            ))}
          </div>
          {/* Editor Content */}
          <div className="flex-grow p-4 overflow-auto text-sm leading-6 outline-none" contentEditable="true" onInput={(e) => setCode(e.currentTarget.innerText)}>
            <pre className="font-mono">
              <code className="text-[#d4d4d4]">
                {code}
              </code>
            </pre>
          </div>
        </div>

        {/* Output Terminal */}
        <div className={`transition-all duration-300 ease-in-out bg-[#1e1e1e] border-t border-black/20 ${isTerminalOpen ? 'h-48' : 'h-0'}`}>
          <div className="h-8 bg-[#252526] flex items-center justify-between px-4 border-b border-black/20">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <Terminal className="w-3 h-3" />
              <span>Terminal</span>
            </div>
            <button onClick={() => setIsTerminalOpen(false)} className="text-gray-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="p-3 text-xs font-mono text-gray-400 overflow-auto h-full">
            {output || '> Waiting for execution...'}
          </div>
        </div>
      </div>

      {/* AI Insights Panel (Right) */}
      <div className="w-80 bg-[#252526] border-l border-black/20 flex flex-col">
        <div className="p-4 border-b border-black/20 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            {aiInsights[activeTool].title}
          </h2>
        </div>
        <div className="flex-grow p-4 overflow-auto">
          {activeTool === 'explain' && (
            <div className="flex flex-col gap-4">
              {aiInsights.explain.content.map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 text-[10px] flex items-center justify-center shrink-0 border border-blue-500/30">
                    {item.step}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          )}

          {activeTool === 'debug' && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30 flex items-center gap-2 text-xs text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                {aiInsights.debug.status}
              </div>
              <div className="flex flex-col gap-3">
                {aiInsights.debug.suggestions.map((sug, i) => (
                  <div key={i} className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                    <div className="flex items-center gap-2 text-xs font-bold text-yellow-500 mb-1">
                      <AlertTriangle className="w-3 h-3" />
                      {sug.issue}
                    </div>
                    <p className="text-xs text-gray-400">{sug.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'optimize' && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
                <p className="text-[10px] uppercase font-bold text-blue-400 mb-2">Optimized Version</p>
                <pre className="text-[11px] text-gray-300 bg-black/30 p-2 rounded border border-white/5 overflow-x-auto">
                  {aiInsights.optimize.optimized}
                </pre>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Benefit</p>
                <p className="text-xs text-gray-400">{aiInsights.optimize.benefit}</p>
              </div>
            </div>
          )}

          {activeTool === 'analyze' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-blue-400 uppercase">Time Complexity</span>
                  <span className="px-2 py-1 rounded bg-blue-500 text-white text-[10px] font-bold">
                    {aiInsights.analyze.metrics.time}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-blue-400 uppercase">Space Complexity</span>
                  <span className="px-2 py-1 rounded bg-blue-500 text-white text-[10px] font-bold">
                    {aiInsights.analyze.metrics.space}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  "{aiInsights.analyze.metrics.description}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToolButton = ({ active, onClick, icon, label }) => (
  <div className="group relative flex items-center justify-center">
    <button 
      onClick={onClick} 
      className={`p-2 rounded-lg transition-all ${
        active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
        : 'text-gray-500 hover:bg-gray-700 hover:text-gray-300'
      }`}
    >
      {icon}
    </button>
    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
      {label}
    </span>
  </div>
);

export default AICodingAssistant;
