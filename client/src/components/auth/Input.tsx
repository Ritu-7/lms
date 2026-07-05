import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, hint, error, className = '', id, ...props }, ref) => {
  const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <label htmlFor={inputId} className="flex flex-col gap-2 text-left">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {hint ? <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
      </div>
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white ${className}`}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-red-500">{error}</span> : null}
    </label>
  )
})

Input.displayName = 'Input'

export default Input
