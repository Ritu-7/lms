import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle2,
  Globe2,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  Mail,
  Moon,
  Save,
  Shield,
  SlidersHorizontal,
  Sun,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import Footer from '../../components/students/Footer';

const MotionDiv = motion.div;

// lucide-react 1.0 removed all brand icons (GitHub, Twitter, etc.).
// Local replacement so we don't need an extra dependency for one icon.
const GithubIcon = ({ size = 18, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.1 3.29 9.42 7.86 10.95.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.43-2.69 5.41-5.25 5.7.42.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .3.21.66.8.55A10.52 10.52 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5z" />
  </svg>
);

const defaultPreferences = {
  name: '',
  email: '',
  photoUrl: '',
  timezone: 'Asia/Kolkata',
  language: 'en',
  theme: 'system',
  accountVisibility: 'private',
  twoFactorEnabled: false,
  marketingEmails: false,
  emailNotifications: true,
  courseUpdates: true,
  assignmentReminders: true,
  certificateAlerts: true,
  profileDiscoverable: false,
  showProgress: true,
  allowEducatorMessages: true,
  connectedGoogle: true,
  connectedGithub: false,
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'account', label: 'Account', icon: SlidersHorizontal },
  { id: 'password', label: 'Password', icon: KeyRound },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'connections', label: 'Connections', icon: Link2 },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
];

const timezones = ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Singapore'];

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
    <div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
      {description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
      aria-pressed={checked}
      aria-label={label}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

const Field = ({ label, icon: Icon, children }) => (
  <label className="block">
    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
      {Icon && <Icon size={16} className="text-blue-600 dark:text-blue-300" />}
      {label}
    </span>
    {children}
  </label>
);

const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const Settings = () => {
  const { userData } = useContext(AppContext);
  const { user, isLoaded } = useUser();

  const initialSettings = useMemo(() => ({
    ...defaultPreferences,
    name: userData?.name || user?.fullName || '',
    email: userData?.email || user?.primaryEmailAddress?.emailAddress || '',
    photoUrl: userData?.imageUrl || user?.imageUrl || '',
  }), [userData, user]);

  const [formData, setFormData] = useState(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    let timer;

    try {
      setLoading(true);
      setError('');
      setFormData(initialSettings);
    } catch (err) {
      setError(err.message || 'Failed to load settings.');
    } finally {
      timer = window.setTimeout(() => setLoading(false), 350);
    }

    return () => window.clearTimeout(timer);
  }, [initialSettings, isLoaded]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setFormData(initialSettings);
    toast.info('Changes discarded');
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      toast.success('Settings saved successfully');
    } catch (err) {
      const message = err.message || 'Failed to save settings.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-10 flex items-center justify-between gap-6">
            <div className="space-y-3 animate-pulse">
              <div className="h-8 w-56 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-80 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="hidden h-12 w-36 rounded-xl bg-slate-200 dark:bg-slate-800 md:block animate-pulse" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm lg:block animate-pulse">
              {[...Array(7)].map((_, index) => <div key={index} className="mb-3 h-11 rounded-xl bg-slate-200 dark:bg-slate-800" />)}
            </div>
            <div className="space-y-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm animate-pulse">
                  <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <form onSubmit={handleSave} className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-4">
              <SlidersHorizontal size={16} />
              Student preferences
            </div>
            <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-white">Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your profile, account security, notifications, and privacy preferences.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-70 transition-all"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 transition-all active:scale-95 shadow-lg shadow-blue-600/25"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-8 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-5 text-sm text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-3 font-semibold"><AlertTriangle size={18} /> {error}</div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3 shadow-sm">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <a key={section.id} href={`#${section.id}`} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
                    <Icon size={16} />
                    {section.label}
                  </a>
                );
              })}
            </div>
          </aside>

          <main className="space-y-6">
            <MotionDiv id="profile" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
                <div>
                  <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Profile Information</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep your public learner profile accurate and recognizable.</p>
                </div>
                <UserRound className="text-blue-600 dark:text-blue-300" />
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-[220px_1fr]">
                <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-5 text-center">
                  <img src={formData.photoUrl || 'https://ui-avatars.com/api/?name=Student'} alt="Profile" className="mx-auto h-28 w-28 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-800 shadow-sm" />
                  <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5">
                    <Camera size={14} /> Change Photo
                  </button>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Full Name" icon={UserRound}><input className={inputClass} value={formData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Your name" /></Field>
                  <Field label="Email Address" icon={Mail}><input className={inputClass} value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" type="email" /></Field>
                  <Field label="Profile Photo URL" icon={Camera}><input className={inputClass} value={formData.photoUrl} onChange={(e) => updateField('photoUrl', e.target.value)} placeholder="https://..." /></Field>
                  <Field label="Timezone" icon={Globe2}>
                    <select className={inputClass} value={formData.timezone} onChange={(e) => updateField('timezone', e.target.value)}>
                      {timezones.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </MotionDiv>

            <MotionDiv id="account" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Account Settings</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Toggle checked={formData.twoFactorEnabled} onChange={() => updateField('twoFactorEnabled', !formData.twoFactorEnabled)} label="Two-factor authentication" description="Add an extra layer of security to your student account." />
                <Toggle checked={formData.marketingEmails} onChange={() => updateField('marketingEmails', !formData.marketingEmails)} label="Product tips and offers" description="Receive occasional LMS updates, tips, and promotions." />
              </div>
            </MotionDiv>

            <MotionDiv id="password" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Password Change</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <Field label="Current Password" icon={Lock}><input className={inputClass} type="password" value={formData.currentPassword} onChange={(e) => updateField('currentPassword', e.target.value)} placeholder="••••••••" /></Field>
                <Field label="New Password" icon={KeyRound}><input className={inputClass} type="password" value={formData.newPassword} onChange={(e) => updateField('newPassword', e.target.value)} placeholder="••••••••" /></Field>
                <Field label="Confirm Password" icon={CheckCircle2}><input className={inputClass} type="password" value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="••••••••" /></Field>
              </div>
            </MotionDiv>

            <MotionDiv id="notifications" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Notification Preferences</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Toggle checked={formData.emailNotifications} onChange={() => updateField('emailNotifications', !formData.emailNotifications)} label="Email notifications" description="Send important learning updates to your inbox." />
                <Toggle checked={formData.courseUpdates} onChange={() => updateField('courseUpdates', !formData.courseUpdates)} label="Course updates" description="Notify me when enrolled courses publish new content." />
                <Toggle checked={formData.assignmentReminders} onChange={() => updateField('assignmentReminders', !formData.assignmentReminders)} label="Assignment reminders" description="Get reminders before assignment due dates." />
                <Toggle checked={formData.certificateAlerts} onChange={() => updateField('certificateAlerts', !formData.certificateAlerts)} label="Certificate alerts" description="Notify me when certificates are issued or verified." />
              </div>
            </MotionDiv>

            <div className="grid gap-6 xl:grid-cols-2">
              <MotionDiv initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Theme</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }, { value: 'system', label: 'System', icon: SlidersHorizontal }].map((theme) => {
                    const Icon = theme.icon;
                    const active = formData.theme === theme.value;
                    return <button key={theme.value} type="button" onClick={() => updateField('theme', theme.value)} className={`rounded-xl border p-4 text-left transition-all ${active ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}><Icon size={18} /><span className="mt-3 block text-sm font-semibold">{theme.label}</span></button>;
                  })}
                </div>
              </MotionDiv>

              <MotionDiv initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Language</h2>
                <div className="mt-6">
                  <Field label="Preferred Language" icon={Globe2}>
                    <select className={inputClass} value={formData.language} onChange={(e) => updateField('language', e.target.value)}>
                      {languages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
                    </select>
                  </Field>
                </div>
              </MotionDiv>
            </div>

            <MotionDiv id="privacy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Privacy Settings</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Account Visibility" icon={Shield}>
                  <select className={inputClass} value={formData.accountVisibility} onChange={(e) => updateField('accountVisibility', e.target.value)}>
                    <option value="private">Private</option>
                    <option value="classmates">Visible to classmates</option>
                    <option value="public">Public profile</option>
                  </select>
                </Field>
                <Toggle checked={formData.profileDiscoverable} onChange={() => updateField('profileDiscoverable', !formData.profileDiscoverable)} label="Discoverable profile" description="Allow other learners to find your public profile." />
                <Toggle checked={formData.showProgress} onChange={() => updateField('showProgress', !formData.showProgress)} label="Show learning progress" description="Display completed courses and certificates on your profile." />
                <Toggle checked={formData.allowEducatorMessages} onChange={() => updateField('allowEducatorMessages', !formData.allowEducatorMessages)} label="Educator messages" description="Allow course educators to contact you about enrolled courses." />
              </div>
            </MotionDiv>

            <MotionDiv id="connections" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Connected Accounts</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Toggle checked={formData.connectedGoogle} onChange={() => updateField('connectedGoogle', !formData.connectedGoogle)} label="Google" description="Use Google for sign-in and account recovery." />
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
                  <div className="mb-4 flex items-center gap-3"><GithubIcon size={18} className="text-slate-700 dark:text-slate-200" /><div><p className="text-sm font-semibold text-slate-900 dark:text-white">GitHub</p><p className="text-xs text-slate-500 dark:text-slate-400">Connect GitHub for developer courses and labs.</p></div></div>
                  <button type="button" onClick={() => updateField('connectedGithub', !formData.connectedGithub)} className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${formData.connectedGithub ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{formData.connectedGithub ? 'Disconnect' : 'Connect GitHub'}</button>
                </div>
              </div>
            </MotionDiv>

            <MotionDiv id="danger" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 p-6 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold font-space-grotesk text-rose-700 dark:text-rose-300"><AlertTriangle size={20} /> Danger Zone</h2>
                  <p className="mt-2 max-w-2xl text-sm text-rose-600/80 dark:text-rose-300/80">Deleting your account is permanent and may remove enrollments, progress, certificates, bookmarks, and saved preferences.</p>
                </div>
                <button type="button" onClick={() => toast.error('Account deletion requires backend confirmation and is not enabled from this draft settings page.')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20">
                  <Trash2 size={16} /> Delete Account
                </button>
              </div>
            </MotionDiv>
          </main>
        </div>
      </form>
      <Footer />
    </div>
  );
};

export default Settings;