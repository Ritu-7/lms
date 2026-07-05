import React from 'react';

const Logo = ({ className = '', showText = true, light = false }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 shadow-lg shadow-indigo-200 dark:shadow-none">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-white"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-cyan-400 dark:border-slate-900" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-space-grotesk text-xl font-bold tracking-tight leading-none ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            LearnSphere<span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </span>
          <span className={`text-[10px] font-medium uppercase tracking-[0.15em] opacity-60 ${light ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            Smarter Learning
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
