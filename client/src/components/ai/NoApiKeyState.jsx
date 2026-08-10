import React from 'react';
import { motion } from 'framer-motion';
import { Key, ExternalLink, Settings, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NoApiKeyState = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-6"
      >
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-violet-600/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
          <Key size={36} className="text-indigo-500" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md"
        >
          <Sparkles size={12} className="text-white" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="mb-8 max-w-md"
      >
        <h2 className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-white mb-3">
          AI Features are Locked
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
          LearnSphereAI allows you to bring your own Gemini API key to unlock powerful AI capabilities. It's secure, private, and gives you full control.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/settings/ai')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-semibold transition-colors shadow-lg shadow-blue-600/25"
          >
            <Settings size={18} />
            Configure AI Settings
          </button>
          
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 text-sm font-semibold transition-colors"
          >
            Get API Key
            <ExternalLink size={16} />
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default NoApiKeyState;
