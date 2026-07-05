import type { SocialProviderConfig } from '../../types/auth'

interface SocialLoginButtonProps {
  provider: SocialProviderConfig
  onClick: () => void
  isLoading?: boolean
}

const icons: Record<SocialProviderConfig['key'], JSX.Element> = {
  google: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M21.35 11.1H12v2.95h5.35c-.23 1.47-1.2 2.72-2.55 3.56v2.96h4.12c2.4-2.21 3.78-5.46 3.78-9.47 0-.69-.06-1.28-.15-1.96Z" />
      <path fill="currentColor" d="M12 22c3.24 0 5.96-1.08 7.95-2.95l-4.12-2.96c-1.14.76-2.59 1.21-3.83 1.21-2.94 0-5.43-1.99-6.32-4.67H1.43v2.95A11.96 11.96 0 0 0 12 22Z" />
      <path fill="currentColor" d="M5.68 12.63A7.18 7.18 0 0 1 5.3 10c0-.92.16-1.81.38-2.63V4.42H1.43A11.96 11.96 0 0 0 .04 10c0 1.9.46 3.7 1.39 5.58l4.25-2.95Z" />
      <path fill="currentColor" d="M12 5.02c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.94 1.41 15.23.33 12 .33A11.96 11.96 0 0 0 1.43 4.42l4.25 2.95C6.57 6.25 9.06 5.02 12 5.02Z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.11.79-.25.79-.56v-1.96c-3.22.7-3.9-1.37-3.9-1.37-.53-1.36-1.3-1.72-1.3-1.72-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.41-1.26.74-1.55-2.58-.29-5.3-1.29-5.3-5.76 0-1.27.45-2.31 1.2-3.12-.12-.3-.52-1.47.12-3.06 0 0 .98-.31 3.2 1.19a11.14 11.14 0 0 1 5.83 0c2.23-1.5 3.2-1.19 3.2-1.19.64 1.59.24 2.76.12 3.06.75.81 1.2 1.85 1.2 3.12 0 4.48-2.73 5.46-5.32 5.75.42.36.8 1.08.8 2.18v3.23c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  ),
}

const SocialLoginButton = ({ provider, onClick, isLoading = false }: SocialLoginButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 ${provider.accent}`}
    >
      <span className="text-current">{icons[provider.key]}</span>
      <span>{isLoading ? 'Connecting...' : provider.label}</span>
    </button>
  )
}

export default SocialLoginButton
