import { useState, useEffect, useContext, useCallback } from 'react'
import {
  Key, Eye, EyeOff, Check, X, Loader2, ExternalLink, Zap,
  Bot, BookOpen, Layers, FileText, Shield, Settings2, Bell,
  Palette, CreditCard, Users, AlertTriangle, Trash2, RefreshCw,
  ChevronDown, ChevronRight, Save, Globe, Lock, CheckCircle,
  XCircle, SlidersHorizontal, ArrowRight, Info, Mail
} from 'lucide-react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AppContext } from '../../context/AppContext'

// ─── SVG Assets ─────────────────────────────────────────────────────────────

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const SparkleSquircle = () => (
  <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center shrink-0 shadow-sm border border-indigo-50 dark:border-indigo-800/30">
    <Zap size={32} className="text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
  </div>
)

const LightbulbIcon = () => (
  <div className="shrink-0 p-2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
    </svg>
  </div>
)

// ─── Reusable UI Primitives ──────────────────────────────────────────────────

const inputCls = "w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2.5 text-sm text-slate-900 dark:text-dk-text placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
const selectCls = "w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2.5 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors appearance-none cursor-pointer"
const labelCls = "block text-sm font-medium text-slate-700 dark:text-dk-text-2 mb-1.5"
const sectionHeadCls = "text-base font-bold font-space-grotesk text-slate-900 dark:text-dk-text mb-1"
const sectionDescCls = "text-xs text-slate-500 dark:text-dk-text-2 mb-5"
const cardCls = "bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl p-6 shadow-sm"
const dividerCls = "border-t border-slate-100 dark:border-dk-border my-6"

interface ToggleProps { enabled: boolean; onChange: () => void; label: string; desc?: string; disabled?: boolean }
const Toggle = ({ enabled, onChange, label, desc, disabled = false }: ToggleProps) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold ${disabled ? 'text-slate-400' : 'text-slate-900 dark:text-dk-text'}`}>{label}</p>
      {desc && <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-0.5">{desc}</p>}
    </div>
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
      role="switch"
      aria-checked={enabled}
    >
      <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
)

const SaveRow = ({ onSave, loading }: { onSave: () => void; loading: boolean }) => (
  <div className="flex justify-end mt-6 pt-4 border-t border-slate-100 dark:border-dk-border">
    <button
      onClick={onSave}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {loading ? 'Saving...' : 'Save Changes'}
    </button>
  </div>
)

// ─── Types & Constants ────────────────────────────────────────────────────────

interface KeyStatus { hasKey: boolean; addedAt: string | null }
type TestState = 'idle' | 'testing' | 'success' | 'error'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const TABS = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'permissions', label: 'Permissions', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'ai', label: 'AI & Integrations', icon: Zap },
  { id: 'advanced', label: 'Advanced', icon: SlidersHorizontal },
]

const AI_FEATURES = [
  { id: 'admin_copilot', label: 'Admin Copilot', desc: 'Ask questions about your LMS data', icon: Bot },
  { id: 'course_health', label: 'Course Health Analysis', desc: 'AI insights for course performance', icon: Layers },
  { id: 'content_suggestions', label: 'Content Suggestions', desc: 'Get AI-powered content recommendations', icon: BookOpen },
  { id: 'ai_summaries', label: 'Automated Summaries', desc: 'Generate summaries for reviews and feedback', icon: FileText },
]

const STORAGE_KEY = 'admin_ai_features'

// ─── Settings Component ───────────────────────────────────────────────────────

const Settings = () => {
  const { backendURL, getToken } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('general')

  // ── AI tab state ────────────────────────────────────────────────────────────
  const [keyStatus, setKeyStatus] = useState<KeyStatus>({ hasKey: false, addedAt: null })
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState<TestState>('idle')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [features, setFeatures] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s) } catch { /**/ }
    return { admin_copilot: true, course_health: true, content_suggestions: true, ai_summaries: true }
  })

  // ── General tab state ───────────────────────────────────────────────────────
  const [general, setGeneral] = useState({ name: 'LearnSphereAI', url: 'https://learnsphereai.com', supportEmail: 'support@learnsphereai.com', timezone: 'Asia/Kolkata', language: 'en', maintenanceMode: false })
  const [generalSaving, setGeneralSaving] = useState(false)

  // ── Security tab state ──────────────────────────────────────────────────────
  const [security, setSecurity] = useState({ twoFactor: false, sessionTimeout: '24', enforceStrongPassword: true, maxLoginAttempts: '5', jwtSecret: '', allowedOrigins: 'https://learnsphereai.com', ipWhitelist: '' })
  const [secSaving, setSecSaving] = useState(false)

  // ── Permissions tab state ───────────────────────────────────────────────────
  const [perms, setPerms] = useState({ studentSignup: true, educatorSignup: true, autoApproveEducators: false, publicCourses: true, guestBrowsing: true, requireEmailVerification: true, allowContentDownload: false, showCertificates: true })
  const [permSaving, setPermSaving] = useState(false)

  // ── Notifications tab state ─────────────────────────────────────────────────
  const [notif, setNotif] = useState({ enrollmentEmail: true, courseCompleteEmail: true, quizResultEmail: false, announcementEmail: true, weeklyDigest: false, adminAlerts: true, pushEnabled: false, smtpHost: 'smtp.gmail.com', smtpPort: '587', smtpUser: 'noreply@learnsphereai.com', smtpPass: '' })
  const [notifSaving, setNotifSaving] = useState(false)

  // ── Branding tab state ──────────────────────────────────────────────────────
  const [brand, setBrand] = useState({ platformName: 'LearnSphereAI', tagline: 'Smarter Learning', primaryColor: '#4F46E5', secondaryColor: '#7C3AED', logoUrl: '', faviconUrl: '', customCss: '', footerText: '© 2026 LearnSphereAI. All rights reserved.' })
  const [brandSaving, setBrandSaving] = useState(false)

  // ── Billing tab state ───────────────────────────────────────────────────────
  const [billing, setBilling] = useState({ razorpayKeyId: '', razorpayKeySecret: '', currency: 'INR', taxRate: '18', invoicePrefix: 'INV', trialDays: '7', enableCoupons: true, enableRefunds: true })
  const [showRazSecret, setShowRazSecret] = useState(false)
  const [billSaving, setBillSaving] = useState(false)

  // ── Advanced tab state ──────────────────────────────────────────────────────
  const [adv, setAdv] = useState({ debugMode: false, analyticsEnabled: true, rateLimitEnabled: true, rateLimitWindow: '15', rateLimitMax: '100', logLevel: 'info', cacheEnabled: true, cacheTTL: '3600', backupEnabled: false })
  const [advSaving, setAdvSaving] = useState(false)

  // ── Key status ──────────────────────────────────────────────────────────────
  const fetchKeyStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const token = await getToken()
      const res = await axios.get(`${backendURL}/api/ai/key/status`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data?.success) {
        setKeyStatus({ hasKey: res.data.hasKey, addedAt: res.data.addedAt })
        if (res.data.hasKey) setKeyInput('••••••••••••••••••••••••••••••••')
      }
    } catch { /**/ } finally { setLoadingStatus(false) }
  }, [backendURL, getToken])

  useEffect(() => { fetchKeyStatus() }, [fetchKeyStatus])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const handleFeatureChange = (id: string, val: boolean) => {
    const u = { ...features, [id]: val }; setFeatures(u)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) } catch { /**/ }
  }
  const simulateSave = (setter: (v: boolean) => void, successMsg: string) => {
    setter(true)
    setTimeout(() => { setter(false); toast.success(successMsg) }, 800)
  }

  const handleTest = async () => {
    if (!keyInput || keyInput === '••••••••••••••••••••••••••••••••') { toast.info('Please enter a new API key to test.'); return }
    setTestState('testing')
    try {
      const token = await getToken()
      const res = await axios.post(`${backendURL}/api/ai/key/test`, { apiKey: keyInput.trim() }, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data?.success) { setTestState('success'); toast.success('Connection successful!') }
      else { setTestState('error'); toast.error(res.data?.message || 'Connection failed.') }
    } catch (err: any) { setTestState('error'); toast.error(err.response?.data?.message || 'Connection failed.') }
  }

  const handleSaveKey = async () => {
    if (!keyInput || keyInput === '••••••••••••••••••••••••••••••••') { toast.info('Please enter a new API key to save.'); return }
    setSaveState('saving')
    try {
      const token = await getToken()
      const res = await axios.post(`${backendURL}/api/ai/key`, { apiKey: keyInput.trim() }, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data?.success) {
        setSaveState('saved'); setTestState('idle'); toast.success('API key saved securely.'); await fetchKeyStatus()
        setTimeout(() => setSaveState('idle'), 3000)
      } else { setSaveState('error'); toast.error(res.data?.message || 'Failed to save key.'); setTimeout(() => setSaveState('idle'), 3000) }
    } catch (err: any) { setSaveState('error'); toast.error(err.response?.data?.message || 'Failed to save key.'); setTimeout(() => setSaveState('idle'), 3000) }
  }

  // ── Tab content renderers ────────────────────────────────────────────────────

  const renderGeneral = () => (
    <div className="flex flex-col gap-6">
      <div className={cardCls}>
        <h3 className={sectionHeadCls}>Platform Information</h3>
        <p className={sectionDescCls}>Basic details about your LMS platform.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Platform Name</label>
            <input className={inputCls} value={general.name} onChange={e => setGeneral(p => ({ ...p, name: e.target.value }))} placeholder="LearnSphereAI" />
          </div>
          <div>
            <label className={labelCls}>Platform URL</label>
            <input className={inputCls} value={general.url} onChange={e => setGeneral(p => ({ ...p, url: e.target.value }))} placeholder="https://yourdomain.com" />
          </div>
          <div>
            <label className={labelCls}>Support Email</label>
            <input className={inputCls} type="email" value={general.supportEmail} onChange={e => setGeneral(p => ({ ...p, supportEmail: e.target.value }))} placeholder="support@yourdomain.com" />
          </div>
          <div>
            <label className={labelCls}>Default Language</label>
            <select className={selectCls} value={general.language} onChange={e => setGeneral(p => ({ ...p, language: e.target.value }))}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <select className={selectCls} value={general.timezone} onChange={e => setGeneral(p => ({ ...p, timezone: e.target.value }))}>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
        </div>
        <div className={dividerCls} />
        <h4 className="text-sm font-semibold text-slate-900 dark:text-dk-text mb-3">Platform Status</h4>
        <Toggle enabled={general.maintenanceMode} onChange={() => setGeneral(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))} label="Maintenance Mode" desc="Show a maintenance page to all visitors while you make updates." />
        <SaveRow onSave={() => simulateSave(setGeneralSaving, 'General settings saved.')} loading={generalSaving} />
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="flex flex-col gap-6">
      <div className={cardCls}>
        <h3 className={sectionHeadCls}>Authentication</h3>
        <p className={sectionDescCls}>Control how users authenticate and session behaviour.</p>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-dk-border">
          <Toggle enabled={security.twoFactor} onChange={() => setSecurity(p => ({ ...p, twoFactor: !p.twoFactor }))} label="Two-Factor Authentication" desc="Require 2FA for all admin accounts." />
          <Toggle enabled={security.enforceStrongPassword} onChange={() => setSecurity(p => ({ ...p, enforceStrongPassword: !p.enforceStrongPassword }))} label="Enforce Strong Passwords" desc="Minimum 8 chars with uppercase, number, and symbol." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div>
            <label className={labelCls}>Session Timeout (hours)</label>
            <input className={inputCls} type="number" min="1" max="168" value={security.sessionTimeout} onChange={e => setSecurity(p => ({ ...p, sessionTimeout: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Max Login Attempts</label>
            <input className={inputCls} type="number" min="3" max="20" value={security.maxLoginAttempts} onChange={e => setSecurity(p => ({ ...p, maxLoginAttempts: e.target.value }))} />
          </div>
        </div>
        <SaveRow onSave={() => simulateSave(setSecSaving, 'Security settings saved.')} loading={secSaving} />
      </div>
      <div className={cardCls}>
        <h3 className={sectionHeadCls}>Network & Access Control</h3>
        <p className={sectionDescCls}>Restrict access by origin or IP address.</p>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>Allowed CORS Origins</label>
            <input className={inputCls} value={security.allowedOrigins} onChange={e => setSecurity(p => ({ ...p, allowedOrigins: e.target.value }))} placeholder="https://yourdomain.com" />
            <p className="text-xs text-slate-400 mt-1">Comma-separated list of allowed origins.</p>
          </div>
          <div>
            <label className={labelCls}>Admin IP Whitelist</label>
            <textarea
              rows={2}
              className={inputCls + ' resize-none'}
              value={security.ipWhitelist}
              onChange={e => setSecurity(p => ({ ...p, ipWhitelist: e.target.value }))}
              placeholder="192.168.1.1, 10.0.0.0/24 (leave blank to allow all)"
            />
          </div>
        </div>
        <SaveRow onSave={() => simulateSave(setSecSaving, 'Network settings saved.')} loading={secSaving} />
      </div>
    </div>
  )

  const renderPermissions = () => (
    <div className="flex flex-col gap-6">
      <div className={cardCls}>
        <h3 className={sectionHeadCls}>User Registration</h3>
        <p className={sectionDescCls}>Control who can sign up and what happens after registration.</p>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-dk-border">
          <Toggle enabled={perms.studentSignup} onChange={() => setPerms(p => ({ ...p, studentSignup: !p.studentSignup }))} label="Allow Student Sign-up" desc="New users can create student accounts." />
          <Toggle enabled={perms.educatorSignup} onChange={() => setPerms(p => ({ ...p, educatorSignup: !p.educatorSignup }))} label="Allow Educator Sign-up" desc="Users can apply to become educators." />
          <Toggle enabled={perms.autoApproveEducators} onChange={() => setPerms(p => ({ ...p, autoApproveEducators: !p.autoApproveEducators }))} label="Auto-Approve Educators" desc="Approve educator accounts automatically without admin review." />
          <Toggle enabled={perms.requireEmailVerification} onChange={() => setPerms(p => ({ ...p, requireEmailVerification: !p.requireEmailVerification }))} label="Require Email Verification" desc="Users must verify their email before accessing the platform." />
        </div>
        <SaveRow onSave={() => simulateSave(setPermSaving, 'Registration settings saved.')} loading={permSaving} />
      </div>
      <div className={cardCls}>
        <h3 className={sectionHeadCls}>Content & Visibility</h3>
        <p className={sectionDescCls}>Control what content is publicly accessible.</p>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-dk-border">
          <Toggle enabled={perms.publicCourses} onChange={() => setPerms(p => ({ ...p, publicCourses: !p.publicCourses }))} label="Public Course Listings" desc="Courses are visible to unauthenticated visitors." />
          <Toggle enabled={perms.guestBrowsing} onChange={() => setPerms(p => ({ ...p, guestBrowsing: !p.guestBrowsing }))} label="Guest Browsing" desc="Allow visitors to browse course catalogues without logging in." />
          <Toggle enabled={perms.allowContentDownload} onChange={() => setPerms(p => ({ ...p, allowContentDownload: !p.allowContentDownload }))} label="Allow Content Downloads" desc="Students can download lesson PDFs and resources." />
          <Toggle enabled={perms.showCertificates} onChange={() => setPerms(p => ({ ...p, showCertificates: !p.showCertificates }))} label="Public Certificates" desc="Completion certificates have a shareable public URL." />
        </div>
        <SaveRow onSave={() => simulateSave(setPermSaving, 'Permission settings saved.')} loading={permSaving} />
      </div>
    </div>
  )

  const renderNotifications = () => (
    <div className="flex flex-col gap-6">
      <div className={cardCls}>
        <h3 className={sectionHeadCls}>Email Notifications</h3>
        <p className={sectionDescCls}>Choose which events trigger automated emails.</p>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-dk-border">
          <Toggle enabled={notif.enrollmentEmail} onChange={() => setNotif(p => ({ ...p, enrollmentEmail: !p.enrollmentEmail }))} label="Course Enrollment" desc="Send a welcome email when a student enrols." />
          <Toggle enabled={notif.courseCompleteEmail} onChange={() => setNotif(p => ({ ...p, courseCompleteEmail: !p.courseCompleteEmail }))} label="Course Completion" desc="Notify students when they finish a course." />
          <Toggle enabled={notif.quizResultEmail} onChange={() => setNotif(p => ({ ...p, quizResultEmail: !p.quizResultEmail }))} label="Quiz Results" desc="Email quiz scores immediately after submission." />
          <Toggle enabled={notif.announcementEmail} onChange={() => setNotif(p => ({ ...p, announcementEmail: !p.announcementEmail }))} label="Announcements" desc="Notify enrolled students about new announcements." />
          <Toggle enabled={notif.weeklyDigest} onChange={() => setNotif(p => ({ ...p, weeklyDigest: !p.weeklyDigest }))} label="Weekly Activity Digest" desc="Send a weekly progress summary to all active students." />
          <Toggle enabled={notif.adminAlerts} onChange={() => setNotif(p => ({ ...p, adminAlerts: !p.adminAlerts }))} label="Admin System Alerts" desc="Receive critical system alerts and error notifications." />
          <Toggle enabled={notif.pushEnabled} onChange={() => setNotif(p => ({ ...p, pushEnabled: !p.pushEnabled }))} label="Push Notifications" desc="Enable browser push notifications for real-time updates." />
        </div>
        <SaveRow onSave={() => simulateSave(setNotifSaving, 'Notification settings saved.')} loading={notifSaving} />
      </div>
      <div className={cardCls}>
        <h3 className={sectionHeadCls}>SMTP Configuration</h3>
        <p className={sectionDescCls}>Configure the mail server used to send platform emails.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>SMTP Host</label>
            <input className={inputCls} value={notif.smtpHost} onChange={e => setNotif(p => ({ ...p, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label className={labelCls}>SMTP Port</label>
            <input className={inputCls} type="number" value={notif.smtpPort} onChange={e => setNotif(p => ({ ...p, smtpPort: e.target.value }))} placeholder="587" />
          </div>
          <div>
            <label className={labelCls}>SMTP Username</label>
            <input className={inputCls} value={notif.smtpUser} onChange={e => setNotif(p => ({ ...p, smtpUser: e.target.value }))} placeholder="noreply@yourdomain.com" />
          </div>
          <div>
            <label className={labelCls}>SMTP Password</label>
            <input className={inputCls} type="password" value={notif.smtpPass} onChange={e => setNotif(p => ({ ...p, smtpPass: e.target.value }))} placeholder="App password" />
          </div>
        </div>
        <SaveRow onSave={() => simulateSave(setNotifSaving, 'SMTP settings saved.')} loading={notifSaving} />
      </div>
    </div>
  )

  const renderBranding = () => (
    <div className="flex flex-col gap-6">
      <div className={cardCls}>
        <h3 className={sectionHeadCls}>Brand Identity</h3>
        <p className={sectionDescCls}>Customise how your platform presents itself to learners.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Platform Name</label>
            <input className={inputCls} value={brand.platformName} onChange={e => setBrand(p => ({ ...p, platformName: e.target.value }))} placeholder="Your Platform Name" />
          </div>
          <div>
            <label className={labelCls}>Tagline</label>
            <input className={inputCls} value={brand.tagline} onChange={e => setBrand(p => ({ ...p, tagline: e.target.value }))} placeholder="Your Tagline" />
          </div>
          <div>
            <label className={labelCls}>Logo URL</label>
            <input className={inputCls} value={brand.logoUrl} onChange={e => setBrand(p => ({ ...p, logoUrl: e.target.value }))} placeholder="https://cdn.example.com/logo.png" />
          </div>
          <div>
            <label className={labelCls}>Favicon URL</label>
            <input className={inputCls} value={brand.faviconUrl} onChange={e => setBrand(p => ({ ...p, faviconUrl: e.target.value }))} placeholder="https://cdn.example.com/favicon.ico" />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Footer Text</label>
            <input className={inputCls} value={brand.footerText} onChange={e => setBrand(p => ({ ...p, footerText: e.target.value }))} placeholder="© 2026 YourPlatform. All rights reserved." />
          </div>
        </div>
        <div className={dividerCls} />
        <h4 className="text-sm font-semibold text-slate-900 dark:text-dk-text mb-3">Colour Scheme</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Primary Colour</label>
            <div className="flex items-center gap-3">
              <input type="color" value={brand.primaryColor} onChange={e => setBrand(p => ({ ...p, primaryColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-dk-border cursor-pointer p-0.5 bg-white dark:bg-dk-surface" />
              <input className={inputCls + ' flex-1'} value={brand.primaryColor} onChange={e => setBrand(p => ({ ...p, primaryColor: e.target.value }))} placeholder="#4F46E5" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Secondary Colour</label>
            <div className="flex items-center gap-3">
              <input type="color" value={brand.secondaryColor} onChange={e => setBrand(p => ({ ...p, secondaryColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-dk-border cursor-pointer p-0.5 bg-white dark:bg-dk-surface" />
              <input className={inputCls + ' flex-1'} value={brand.secondaryColor} onChange={e => setBrand(p => ({ ...p, secondaryColor: e.target.value }))} placeholder="#7C3AED" />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>Custom CSS</label>
          <textarea
            rows={4}
            className={inputCls + ' font-mono text-xs resize-y'}
            value={brand.customCss}
            onChange={e => setBrand(p => ({ ...p, customCss: e.target.value }))}
            placeholder="/* Add custom styles here */"
          />
          <p className="text-xs text-slate-400 mt-1">Injected into the platform &lt;head&gt; for all pages.</p>
        </div>
        <SaveRow onSave={() => simulateSave(setBrandSaving, 'Branding settings saved.')} loading={brandSaving} />
      </div>
    </div>
  )

  const renderBilling = () => (
    <div className="flex flex-col gap-6">
      <div className={cardCls}>
        <h3 className={sectionHeadCls}>Payment Gateway — Razorpay</h3>
        <p className={sectionDescCls}>Connect Razorpay to process course payments and subscriptions.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Razorpay Key ID</label>
            <input className={inputCls} value={billing.razorpayKeyId} onChange={e => setBilling(p => ({ ...p, razorpayKeyId: e.target.value }))} placeholder="rzp_live_xxxxxxxxxx" />
          </div>
          <div>
            <label className={labelCls}>Razorpay Key Secret</label>
            <div className="relative">
              <input type={showRazSecret ? 'text' : 'password'} className={inputCls + ' pr-11'} value={billing.razorpayKeySecret} onChange={e => setBilling(p => ({ ...p, razorpayKeySecret: e.target.value }))} placeholder="••••••••••••••••••••" />
              <button type="button" onClick={() => setShowRazSecret(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showRazSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <select className={selectCls} value={billing.currency} onChange={e => setBilling(p => ({ ...p, currency: e.target.value }))}>
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Tax Rate (%)</label>
            <input className={inputCls} type="number" min="0" max="100" value={billing.taxRate} onChange={e => setBilling(p => ({ ...p, taxRate: e.target.value }))} placeholder="18" />
          </div>
          <div>
            <label className={labelCls}>Invoice Prefix</label>
            <input className={inputCls} value={billing.invoicePrefix} onChange={e => setBilling(p => ({ ...p, invoicePrefix: e.target.value }))} placeholder="INV" />
          </div>
          <div>
            <label className={labelCls}>Trial Period (days)</label>
            <input className={inputCls} type="number" min="0" value={billing.trialDays} onChange={e => setBilling(p => ({ ...p, trialDays: e.target.value }))} placeholder="7" />
          </div>
        </div>
        <div className={dividerCls} />
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-dk-border">
          <Toggle enabled={billing.enableCoupons} onChange={() => setBilling(p => ({ ...p, enableCoupons: !p.enableCoupons }))} label="Enable Coupon Codes" desc="Students can apply discount coupons at checkout." />
          <Toggle enabled={billing.enableRefunds} onChange={() => setBilling(p => ({ ...p, enableRefunds: !p.enableRefunds }))} label="Enable Refund Requests" desc="Students can submit refund requests within the policy window." />
        </div>
        <SaveRow onSave={() => simulateSave(setBillSaving, 'Billing settings saved.')} loading={billSaving} />
      </div>
    </div>
  )

  const renderAdvanced = () => (
    <div className="flex flex-col gap-6">
      <div className={cardCls}>
        <h3 className={sectionHeadCls}>Developer Options</h3>
        <p className={sectionDescCls}>Advanced settings for debugging, rate limiting, and caching. Change with caution.</p>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-dk-border">
          <Toggle enabled={adv.debugMode} onChange={() => setAdv(p => ({ ...p, debugMode: !p.debugMode }))} label="Debug Mode" desc="Enable verbose logging and expose detailed error messages." />
          <Toggle enabled={adv.analyticsEnabled} onChange={() => setAdv(p => ({ ...p, analyticsEnabled: !p.analyticsEnabled }))} label="Platform Analytics" desc="Track usage patterns and feature engagement across the platform." />
          <Toggle enabled={adv.rateLimitEnabled} onChange={() => setAdv(p => ({ ...p, rateLimitEnabled: !p.rateLimitEnabled }))} label="API Rate Limiting" desc="Protect API endpoints from abuse with per-IP rate limits." />
          <Toggle enabled={adv.cacheEnabled} onChange={() => setAdv(p => ({ ...p, cacheEnabled: !p.cacheEnabled }))} label="Response Caching" desc="Cache frequently accessed API responses to improve performance." />
          <Toggle enabled={adv.backupEnabled} onChange={() => setAdv(p => ({ ...p, backupEnabled: !p.backupEnabled }))} label="Automated Backups" desc="Schedule nightly MongoDB backups to cloud storage." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div>
            <label className={labelCls}>Rate Limit Window (minutes)</label>
            <input className={inputCls} type="number" min="1" value={adv.rateLimitWindow} onChange={e => setAdv(p => ({ ...p, rateLimitWindow: e.target.value }))} disabled={!adv.rateLimitEnabled} />
          </div>
          <div>
            <label className={labelCls}>Max Requests per Window</label>
            <input className={inputCls} type="number" min="10" value={adv.rateLimitMax} onChange={e => setAdv(p => ({ ...p, rateLimitMax: e.target.value }))} disabled={!adv.rateLimitEnabled} />
          </div>
          <div>
            <label className={labelCls}>Cache TTL (seconds)</label>
            <input className={inputCls} type="number" min="60" value={adv.cacheTTL} onChange={e => setAdv(p => ({ ...p, cacheTTL: e.target.value }))} disabled={!adv.cacheEnabled} />
          </div>
          <div>
            <label className={labelCls}>Log Level</label>
            <select className={selectCls} value={adv.logLevel} onChange={e => setAdv(p => ({ ...p, logLevel: e.target.value }))}>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
              <option value="verbose">Verbose</option>
            </select>
          </div>
        </div>
        <SaveRow onSave={() => simulateSave(setAdvSaving, 'Advanced settings saved.')} loading={advSaving} />
      </div>
      <div className={cardCls}>
        <h3 className={sectionHeadCls + ' text-red-600 dark:text-red-400'}>Danger Zone</h3>
        <p className={sectionDescCls}>Irreversible actions that affect the entire platform. Proceed with extreme caution.</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-dk-text">Clear All Cache</p>
              <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-0.5">Purge all cached responses. Users may notice brief slowness.</p>
            </div>
            <button onClick={() => toast.success('Cache cleared.')} className="shrink-0 px-4 py-2 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
              Clear Cache
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-dk-text">Reset All Settings</p>
              <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-0.5">Restore all platform settings to factory defaults.</p>
            </div>
            <button onClick={() => toast.error('This action is locked in the demo environment.')} className="shrink-0 px-4 py-2 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
              Reset Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAI = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col xl:flex-row gap-6 justify-between xl:items-center p-6 bg-white dark:bg-dk-surface rounded-2xl border border-slate-200 dark:border-dk-border shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <SparkleSquircle />
          <div>
            <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">AI & Integrations</h2>
            <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-1">Configure AI providers and external services to enhance your platform experience.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F5F7FF] dark:bg-indigo-950/20 border border-[#EBEFFF] dark:border-indigo-900/30 max-w-md w-full">
          <LightbulbIcon />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-400">Power up LearnSphereAI with AI</h4>
            <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-1 leading-relaxed">Use your own Gemini API key to enable AI features like Admin Copilot, course insights, content analysis, and more.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
        <div className="xl:col-span-3 bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <GoogleLogo />
            <h3 className="text-base font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Google Gemini API</h3>
            {keyStatus.hasKey
              ? <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">Enabled</span>
              : <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">Not Configured</span>}
          </div>
          <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-2 mb-6">Connect your Gemini API key to power AI features across the admin dashboard.</p>
          <div className="bg-[#FAFAFA] dark:bg-dk-surface-2/50 border border-slate-100 dark:border-dk-border rounded-xl p-5 flex-1">
            <label className="text-sm font-semibold text-slate-900 dark:text-dk-text">Gemini API Key <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2 mt-2 bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
              <input type={showKey ? 'text' : 'password'} value={keyInput} onChange={e => { setKeyInput(e.target.value); if (testState !== 'idle') setTestState('idle') }} placeholder="Enter your API key..." className="flex-1 bg-transparent text-sm font-mono text-slate-900 dark:text-dk-text outline-none placeholder:font-sans" spellCheck={false} />
              <button type="button" onClick={() => setShowKey(!showKey)} className="text-slate-400 hover:text-slate-600 transition-colors">{showKey ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              {keyStatus.hasKey && keyInput === '••••••••••••••••••••••••••••••••' && <CheckCircle size={18} className="text-green-500" />}
            </div>
            <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-3 flex items-center gap-1.5">
              Your API key is stored securely and encrypted.
              {testState === 'testing' && <span className="text-blue-500 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Testing...</span>}
              {testState === 'success' && <span className="text-green-500">Connection successful!</span>}
              {testState === 'error' && <span className="text-red-500">Connection failed.</span>}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              <ExternalLink size={16} /> Get your Gemini API key
            </a>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={handleTest} disabled={!keyInput || keyInput === '••••••••••••••••••••••••••••••••' || testState === 'testing'} className="flex-1 sm:flex-none px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500 rounded-lg text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50">Test Connection</button>
              <button onClick={handleSaveKey} disabled={!keyInput || keyInput === '••••••••••••••••••••••••••••••••' || saveState === 'saving'} className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50">{saveState === 'saving' ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Zap size={20} className="fill-purple-600 dark:fill-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold font-space-grotesk text-slate-900 dark:text-dk-text">AI Features</h3>
              <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-0.5">Manage AI-powered features in your platform.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {AI_FEATURES.map(feat => {
              const enabled = !!features[feat.id]
              const disabled = !keyStatus.hasKey
              return (
                <div key={feat.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <feat.icon size={18} className={`mt-0.5 ${disabled ? 'text-slate-300' : 'text-slate-500 dark:text-dk-text-2'}`} />
                    <div>
                      <h4 className={`text-sm font-semibold ${disabled ? 'text-slate-400' : 'text-slate-900 dark:text-dk-text'}`}>{feat.label}</h4>
                      <p className="text-xs text-slate-500 dark:text-dk-text-3 mt-0.5 leading-relaxed pr-4">{feat.desc}</p>
                    </div>
                  </div>
                  <button type="button" disabled={disabled} onClick={() => handleFeatureChange(feat.id, !enabled)} className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${enabled && !disabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'} disabled:opacity-50`}>
                    <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${enabled && !disabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><Mail size={18} /></div>
            <div><h3 className="text-sm font-bold text-slate-900 dark:text-dk-text">Email Configuration</h3><p className="text-xs text-slate-500 dark:text-dk-text-2 mt-0.5">Configure email settings for notifications.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-y-3 mt-5 text-sm flex-1">
            <span className="text-slate-500 dark:text-dk-text-2">Provider</span><span className="font-medium text-slate-900 dark:text-dk-text text-right">Gmail (SMTP)</span>
            <span className="text-slate-500 dark:text-dk-text-2">From Email</span><span className="font-medium text-slate-900 dark:text-dk-text text-right truncate">noreply@learnsphereai.com</span>
            <span className="text-slate-500 dark:text-dk-text-2">Status</span><span className="font-medium text-green-600 flex items-center justify-end gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Connected</span>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-dk-border"><button onClick={() => setActiveTab('notifications')} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">Manage <ArrowRight size={14} /></button></div>
        </div>
        <div className="bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><CreditCard size={18} /></div>
            <div><h3 className="text-sm font-bold text-slate-900 dark:text-dk-text">Payment Integration</h3><p className="text-xs text-slate-500 dark:text-dk-text-2 mt-0.5">Manage payment gateways and billing.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-y-3 mt-5 text-sm flex-1">
            <span className="text-slate-500 dark:text-dk-text-2">Provider</span><span className="font-medium text-slate-900 dark:text-dk-text text-right">Razorpay</span>
            <span className="text-slate-500 dark:text-dk-text-2">Mode</span><span className="font-medium text-slate-900 dark:text-dk-text text-right">Live</span>
            <span className="text-slate-500 dark:text-dk-text-2">Status</span><span className="font-medium text-green-600 flex items-center justify-end gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Connected</span>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-dk-border"><button onClick={() => setActiveTab('billing')} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">Manage <ArrowRight size={14} /></button></div>
        </div>
        <div className="bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><Info size={18} /></div>
            <div><h3 className="text-sm font-bold text-slate-900 dark:text-dk-text">System Information</h3><p className="text-xs text-slate-500 dark:text-dk-text-2 mt-0.5">View platform details and environment info.</p></div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-y-3 mt-5 text-sm flex-1">
            <span className="text-slate-500 dark:text-dk-text-2">Version</span><span className="font-medium text-slate-900 dark:text-dk-text text-right">v1.0.0</span>
            <span className="text-slate-500 dark:text-dk-text-2">Environment</span><span className="font-medium text-slate-900 dark:text-dk-text text-right">Production</span>
            <span className="text-slate-500 dark:text-dk-text-2">Last Updated</span><span className="font-medium text-slate-900 dark:text-dk-text text-right">Sep 7, 2026</span>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-dk-border"><button onClick={() => setActiveTab('advanced')} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">View Details <ArrowRight size={14} /></button></div>
        </div>
      </div>
    </div>
  )

  const RENDERERS: Record<string, () => React.ReactNode> = {
    general: renderGeneral,
    security: renderSecurity,
    permissions: renderPermissions,
    notifications: renderNotifications,
    branding: renderBranding,
    billing: renderBilling,
    ai: renderAI,
    advanced: renderAdvanced,
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-[#FAFAFA] dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Manage platform preferences, integrations, security, and more.</p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search settings..." className="w-full md:w-64 pl-9 pr-4 py-2.5 bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
      </div>

      <div className="flex overflow-x-auto gap-1 pb-px mb-6 border-b border-slate-200 dark:border-dk-border no-scrollbar">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 hover:text-slate-900 dark:text-dk-text-2 dark:hover:text-dk-text'}`}>
              <tab.icon size={15} />
              {tab.label}
              {isActive && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
            </button>
          )
        })}
      </div>

      <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
        {RENDERERS[activeTab]?.()}
      </div>
    </div>
  )
}

export default Settings
