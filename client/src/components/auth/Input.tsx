import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 text-left">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={inputId} className="text-sm font-medium text-slate-200">
            {label}
          </label>
          {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
        </div>
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-300/10 ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs font-medium text-red-400">{error}</span>
        ) : null}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
