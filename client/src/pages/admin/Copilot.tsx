import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Send, Brain, Bot, User as UserIcon, Check, Copy, AlertTriangle, Loader2 } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { aiRequest } from '../../utils/aiClient';
import AdminSection from '../../components/admin/AdminSection';
import NoApiKeyState from '../../components/ai/NoApiKeyState';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      title="Copy"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const MessageContent = ({ text }: { text: string }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-headings:font-space-grotesk prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-blue-600 dark:prose-code:text-blue-300 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');
            return !inline && match ? (
              <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-dk-border bg-slate-950 not-prose">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-dk-surface border-b border-white/5">
                  <span className="text-xs font-mono font-medium text-slate-400">{match[1]}</span>
                  <CopyButton text={codeText} />
                </div>
                <pre className="px-4 py-3.5 text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  <code {...props}>{children}</code>
                </pre>
              </div>
            ) : (
              <code className={className} {...props}>{children}</code>
            );
          },
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-dk-border not-prose">
                <table className="w-full text-sm text-left">{children}</table>
              </div>
            );
          },
          thead({ children }: any) {
            return <thead className="bg-slate-50 dark:bg-dk-surface text-slate-700 dark:text-dk-text-2 text-xs uppercase tracking-wide">{children}</thead>;
          },
          th({ children }: any) {
            return <th className="px-4 py-3 font-semibold">{children}</th>;
          },
          td({ children }: any) {
            return <td className="px-4 py-3 border-t border-slate-100 dark:border-dk-border-2 text-slate-700 dark:text-dk-text-2">{children}</td>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

const AdminCopilot = () => {
  const { backendURL, getToken } = useContext(AppContext);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'assistant',
    content: 'Hello! I am your Admin Copilot. You can ask me questions about your LMS platform data, such as total revenue, top courses, student enrollment trends, or recent activity.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [noKeyError, setNoKeyError] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      })).concat([{ role: 'user', content: userMessage.content }]);

      const res = await aiRequest({
        backendURL,
        getToken,
        method: 'POST',
        path: '/api/admin/copilot',
        data: { messages: chatHistory, model: 'gemini-3.5-flash' },
      });

      if (res.success) {
        setMessages((prev) => [...prev, {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: res.data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error(res.message || 'Failed to generate response.');
      }
    } catch (error: any) {
      if (error.message === 'No API key configured') {
        setNoKeyError(true);
      } else {
        setMessages((prev) => [...prev, {
          id: `e_${Date.now()}`,
          role: 'assistant',
          content: error.message || 'Sorry, something went wrong. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (noKeyError) {
    return (
      <div className="min-h-screen flex flex-col md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text">
         <NoApiKeyState />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            AI Admin Copilot
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">
            Ask questions about users, enrollments, and revenue metrics.
          </p>
        </div>
      </div>

      <AdminSection title="Copilot Chat" description="Real-time LMS data assistant">
        <div className="flex flex-col h-[600px] border border-slate-200 dark:border-dk-border rounded-2xl bg-white dark:bg-dk-surface overflow-hidden">
          
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                  </div>
                  
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : msg.isError
                          ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-tl-sm'
                          : 'bg-slate-50 dark:bg-dk-surface-2 border border-slate-100 dark:border-dk-border rounded-tl-sm text-slate-800 dark:text-dk-text'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <MessageContent text={msg.content} />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 max-w-[85%]"
                >
                  <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="px-4 py-4 rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-dk-surface-2 border border-slate-100 dark:border-dk-border flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    <span className="text-sm text-slate-500 dark:text-dk-text-2">Copilot is analyzing data...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about revenue, enrollments, users..."
                disabled={isLoading}
                className="w-full bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
          
        </div>
      </AdminSection>
    </div>
  );
};

export default AdminCopilot;
