import { forwardRef, useState } from 'react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ label, hint, error, className = '', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <label className="flex flex-col gap-2 text-left">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      <input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        className={`w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white ${className}`}
        {...props}
      />

      {error ? (
        <span className="text-xs font-medium text-red-500">{error}</span>
      ) : (
        <span className="text-xs text-slate-500 dark:text-slate-400">{hint || 'Use a strong password with at least 8 characters.'}</span>
      )}
    </label>
  )
})

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
