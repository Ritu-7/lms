import { forwardRef, useState } from 'react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  /** Optional action rendered to the right of the label (e.g. "Forgot Password?") */
  labelAction?: React.ReactNode
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, hint, error, labelAction, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="flex flex-col gap-1.5 text-left">
        {/* Row: label + (Forgot Password? | Show/Hide) */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>

          <div className="flex shrink-0 items-center gap-3">
            {labelAction ? <div>{labelAction}</div> : null}

            {/* Vertical separator only when both exist */}
            {labelAction ? (
              <span className="h-3 w-px bg-slate-300 dark:bg-white/15" aria-hidden="true" />
            ) : null}

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs font-semibold leading-none text-slate-500 dark:text-dk-text-2 transition hover:text-blue-600 dark:hover:text-cyan-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Input */}
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`w-full rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-dk-text outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 dark:focus:border-cyan-300/60 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-cyan-300/10 ${className}`}
          {...props}
        />

        {/* Error / hint */}
        {error ? (
          <span className="text-xs font-medium text-red-500 dark:text-red-400">{error}</span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {hint ?? 'Use a strong password with at least 8 characters.'}
          </span>
        )}
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
