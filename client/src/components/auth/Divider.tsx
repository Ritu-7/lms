const Divider = () => {
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-white/10" />
      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Or</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-white/10" />
    </div>
  )
}

export default Divider
