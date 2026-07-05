import type { AuthLayoutProps } from '../../types/auth'

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="grid min-h-[100svh] w-full grid-cols-1 bg-white text-slate-900 dark:bg-slate-950 dark:text-white lg:grid-cols-[4fr_6fr]">
      {children}
    </div>
  )
}

export default AuthLayout
