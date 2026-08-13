import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Key, Trash2, CheckCircle2, ShieldCheck, Sparkles, Loader2, Save,
  Wifi, Eye, EyeOff, ExternalLink, AlertTriangle, ChevronDown,
  ChevronUp, Lock, HelpCircle, Rocket, Copy, MousePointer,
  ArrowRight, RefreshCw, Globe,
} from 'lucide-react';
import { aiRequest, aiGetRequest } from '../../utils/aiClient';

// ─── Guide Steps ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: 1,
    icon: Globe,
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-100 dark:border-blue-500/20',
    title: 'Open Google AI Studio',
    desc: 'Navigate to the Gemini API key management page.',
    action: { label: 'Open Google AI Studio', href: 'https://aistudio.google.com/app/apikey' },
  },
  {
    num: 2,
    icon: Key,
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-100 dark:border-violet-500/20',
    title: 'Sign in with Google',
    desc: 'Use your Google account to sign in to AI Studio.',
  },
  {
    num: 3,
    icon: MousePointer,
    color: 'from-cyan-500 to-blue-500',
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    border: 'border-cyan-100 dark:border-cyan-500/20',
    title: 'Click "Create API Key"',
    desc: 'Find and click the "Create API Key" button on the dashboard.',
  },
  {
    num: 4,
    icon: Globe,
    color: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50 dark:bg-teal-500/10',
    border: 'border-teal-100 dark:border-teal-500/20',
    title: 'Select a Google Cloud Project',
    desc: 'Choose an existing project or create a new one when prompted.',
  },
  {
    num: 5,
    icon: Copy,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-100 dark:border-amber-500/20',
    title: 'Copy Your API Key',
    desc: 'Copy the generated Gemini API key from the dialog.',
  },
  {
    num: 6,
    icon: ArrowRight,
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50 dark:bg-pink-500/10',
    border: 'border-pink-100 dark:border-pink-500/20',
    title: 'Paste the Key Above',
    desc: 'Return to this page and paste the key into the API Key field above.',
  },
  {
    num: 7,
    icon: Wifi,
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    border: 'border-indigo-100 dark:border-indigo-500/20',
    title: 'Test Connection',
    desc: 'Click "Test Connection" to verify your key works correctly.',
  },
  {
    num: 8,
    icon: Save,
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-100 dark:border-emerald-500/20',
    title: 'Save API Key',
    desc: 'Click "Save API Key" to securely store your key.',
  },
];

// ─── FAQs ─────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Is the Gemini API free?',
    a: 'Google provides a generous free tier for Gemini API usage. If your usage exceeds the free quota, charges may apply according to Google\'s pricing.',
  },
  {
    q: 'Can I change my API key later?',
    a: 'Yes. You can update or delete your key anytime from this page.',
  },
  {
    q: 'Where is my key stored?',
    a: 'It is securely encrypted using AES-256-CBC and stored in your account database. We never store or display the plain-text key.',
  },
  {
    q: 'Why do I need my own API key?',
    a: 'This platform uses a Bring Your Own Key (BYOK) model, allowing each user to use their own Gemini API quota while keeping their key private and secure.',
  },
];

// ─── Step Card ─────────────────────────────────────────────────────────────────
const StepCard = ({ step, index }) => {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-start gap-4 p-4 rounded-2xl border ${step.bg} ${step.border} transition-all hover:shadow-md hover:-translate-y-0.5 duration-200`}
    >
      {/* Step number circle */}
      <div className={`shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md`}>
        <span className="text-white text-sm font-bold">{step.num}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-dk-text">
            {step.title}
          </p>
          {step.action && (
            <a
              href={step.action.href}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r ${step.color} text-white text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity`}
            >
              {step.action.label}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-1 leading-relaxed">
          {step.desc}
        </p>
      </div>
    </motion.div>
  );
};

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
const FaqItem = ({ faq, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-white dark:bg-dk-surface hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-800 dark:text-dk-text flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
          {faq.q}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="px-5 py-4 pt-0 text-sm text-slate-600 dark:text-dk-text-2 leading-relaxed border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-dk-surface">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AISettings = () => {
  const { getToken } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [addedAt, setAddedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => { fetchKeyStatus(); }, []); // eslint-disable-line

  const fetchKeyStatus = async () => {
    try {
      setIsLoading(true);
      const res = await aiGetRequest({ backendURL, getToken, path: '/api/ai/key/status' });
      setHasKey(res.hasKey);
      setAddedAt(res.addedAt);
    } catch { /* silent */ } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!apiKey.trim()) { toast.error('Please enter a valid API key'); return; }
    try {
      setIsSaving(true);
      await aiRequest({ backendURL, getToken, path: '/api/ai/key', data: { apiKey: apiKey.trim() } });
      toast.success('✅ API key saved securely');
      setApiKey('');
      setTestSuccess(false);
      await fetchKeyStatus();
    } catch (error) {
      toast.error(error.message || 'Failed to save API key');
    } finally { setIsSaving(false); }
  };

  const handleTest = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) { toast.info('Enter your API key in the field to test the connection.'); return; }
    try {
      setIsTesting(true);
      setTestSuccess(false);
      const { message } = await aiRequest({ backendURL, getToken, path: '/api/ai/key/test', data: { apiKey: keyToTest } });
      toast.success(message || '✅ Connection successful!');
      setTestSuccess(true);
    } catch (error) {
      toast.error(error.message || 'Connection failed. Check your key and try again.');
      setTestSuccess(false);
    } finally { setIsTesting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove your API key? AI features will be disabled until you add a new one.')) return;
    try {
      setIsDeleting(true);
      await aiRequest({ backendURL, getToken, method: 'delete', path: '/api/ai/key' });
      toast.success('API key removed');
      setHasKey(false);
      setAddedAt(null);
      setTestSuccess(false);
    } catch { toast.error('Failed to remove API key'); }
    finally { setIsDeleting(false); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-400">Loading AI settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-12 space-y-8">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">
            AI Settings
          </h1>
        </div>
        <p className="text-slate-500 dark:text-dk-text-2 text-sm leading-relaxed ml-1">
          Manage your personal Gemini API key. Your key is encrypted end-to-end and only used for your own AI requests.
        </p>
      </motion.div>

      {/* ── API Key Card ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-white dark:bg-dk-surface border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-dk-text flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-400" />
            Gemini API Key
          </h2>
          {hasKey ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-dk-surface-2 text-slate-500 dark:text-dk-text-2 text-xs font-semibold">
              Not Configured
            </span>
          )}
        </div>

        <div className="p-6 space-y-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 dark:text-dk-text-2 mb-2">
                {hasKey ? 'Update API Key' : 'Enter your Gemini API Key'}
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setTestSuccess(false); }}
                  placeholder={hasKey ? '••••••••••••••••••••••••' : 'AIzaSy...'}
                  className="w-full bg-slate-50 dark:bg-dk-base border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-900 dark:text-dk-text focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Keys are encrypted using AES-256-CBC before storage.
              </p>
            </div>

            {/* Success after test */}
            <AnimatePresence>
              {testSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    ✅ Connection verified! Click "Save API Key" to store it securely.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" disabled={isSaving || !apiKey.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {hasKey ? 'Update API Key' : 'Save API Key'}
              </button>
              <button type="button" onClick={handleTest} disabled={isTesting || !apiKey.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-dk-surface-2 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] disabled:opacity-50 text-slate-700 dark:text-dk-text px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                Test Connection
              </button>
            </div>
          </form>

          {/* Danger zone */}
          <AnimatePresence>
            {hasKey && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-5 border-t border-slate-100 dark:border-slate-800"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-dk-text">Danger Zone</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Remove your key permanently. AI features will be disabled.
                    </p>
                    {addedAt && (
                      <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <RefreshCw className="w-2.5 h-2.5" />
                        Key saved on {new Date(addedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <button onClick={handleDelete} disabled={isDeleting}
                    className="shrink-0 flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-rose-200 dark:border-rose-500/20 disabled:opacity-50">
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Key
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Guide Card ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
        className="bg-white dark:bg-dk-surface border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Guide header with gradient banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <Rocket className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white font-space-grotesk">
              Get Your Free Gemini API Key
            </h2>
          </div>
          <p className="text-blue-100 text-sm leading-relaxed">
            Follow these simple steps to generate your personal Gemini API key. Your key is encrypted before storage and is never shared.
          </p>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-3">
          {STEPS.map((step, i) => (
            <StepCard key={step.num} step={step} index={i} />
          ))}

          {/* Success banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/25"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                After successful verification
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                ✅ Your API key has been securely encrypted and saved.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Security Info ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-500/30">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">Security</h3>
        </div>
        <ul className="space-y-2">
          {[
            'Your API key is encrypted using AES-256 encryption before being stored.',
            'We never display or store your plain API key after saving.',
            'Only your account can use this key.',
            'You can update or delete your key at any time.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-200/80">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* ── Warning Box ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-2xl p-5 flex items-start gap-3"
      >
        <div className="h-8 w-8 rounded-xl bg-amber-400 flex items-center justify-center shadow-sm shadow-amber-400/30 shrink-0">
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">
            ⚠️ Keep your API key private
          </p>
          <p className="text-sm text-amber-700/80 dark:text-amber-200/70">
            Do not share it publicly or upload it to GitHub. Anyone with access to your API key can make requests on your behalf and exhaust your quota.
          </p>
        </div>
      </motion.div>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-dk-text">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </motion.div>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="flex justify-center pb-4"
      >
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white px-8 py-4 rounded-2xl font-semibold text-sm shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/40 active:scale-[0.98]"
        >
          <Globe className="w-5 h-5" />
          🌐 Get Gemini API Key
          <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
        </a>
      </motion.div>

    </div>
  );
};

export default AISettings;
