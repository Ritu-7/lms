import type { UseFormRegister } from 'react-hook-form'
import type { LoginFormValues } from '../../types/auth'

interface RememberMeProps {
  register: UseFormRegister<LoginFormValues>
}

const RememberMe = ({ register }: RememberMeProps) => {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <input
        type="checkbox"
        {...register('rememberMe')}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-white/20"
      />
      <span>Keep me signed in</span>
    </label>
  )
}

export default RememberMe
