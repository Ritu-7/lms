import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Headphones,
  BookOpen,
  Users,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import Footer from '../../components/students/Footer';

// ─── Local Social/Brand Icons ──────────────────────────────────────────────────
// Brand icons (GitHub, LinkedIn, Twitter/X, Instagram, YouTube) are defined
// locally as inline SVGs rather than imported from lucide-react. Brand-name
// icon exports vary across lucide-react versions/builds and have caused
// repeated "does not provide an export" errors — inlining them removes that
// dependency entirely.
const GithubIcon = ({ size = 18, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55
      0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69
      -1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96
      .1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09
      -.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.06 11.06 0 0 1 5.79 0
      c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.83 1.18
      3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01
      3.17 0 .31.21.66.8.55A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"/>
  </svg>
);

const LinkedinIcon = ({ size = 18, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86
      0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85
      3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0
      1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z"/>
  </svg>
);

const TwitterIcon = ({ size = 18, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M18.9 3H22l-7.19 8.21L23.34 21h-6.62l-5.18-6.77L5.6 21H2.47l7.7-8.8L1 3h6.79l4.68
      6.19L18.9 3zm-1.16 16.17h1.73L7.4 4.73H5.54l12.2 14.44z"/>
  </svg>
);

const InstagramIcon = ({ size = 18, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const YoutubeIcon = ({ size = 18, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88
      0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 11.75a29 29 0 0 0
      .46 5.33 2.78 2.78 0 0 0 1.95 1.97C5.12 19.5 12 19.5 12 19.5s6.88
      0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97 29 29 0 0 0 .46-5.33 29 29 0
      0 0-.46-5.33zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z"/>
  </svg>
);

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const CONTACT_CHANNELS = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'For general enquiries and support',
    value: 'ritikamarotha9@gmail.com',
    href: 'mailto:ritikamarotha9@gmail.com',
    color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900/40',
  },
  {
    icon: Headphones,
    title: 'Live Chat',
    description: 'Available Mon–Sat, 9 AM–6 PM IST',
    value: 'Start Live Chat',
    href: '#chat',
    color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
    border: 'border-violet-100 dark:border-violet-900/40',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'For urgent matters and enterprise sales',
    value: '+91 80039******',
    href: 'tel:+9180039*****',
    color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/40',
  },
  {
    icon: BookOpen,
    title: 'Help Centre',
    description: 'Browse 200+ self-service articles',
    value: 'Visit Help Centre',
    href: '#help',
    color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900/40',
  },
];

const OFFICES = [
  {
    city: 'Bangalore',
    country: 'India (HQ)',
    address: '12th Floor, Prestige Tech Park, Marathahalli, Bangalore — 560 037',
    hours: 'Mon – Sat · 9:00 AM – 6:00 PM IST',
    mapEmbed: 'Bangalore, India',
    gradient: 'from-blue-500 to-indigo-600',
    flag: '🇮🇳',
  },
  {
    city: 'San Francisco',
    country: 'United States',
    address: '450 Townsend Street, Suite 300, San Francisco, CA 94107',
    hours: 'Mon – Fri · 9:00 AM – 5:00 PM PST',
    mapEmbed: 'San Francisco, CA',
    gradient: 'from-violet-500 to-purple-600',
    flag: '🇺🇸',
  },
  {
    city: 'London',
    country: 'United Kingdom',
    address: 'WeWork, 30 Churchill Place, Canary Wharf, London E14 5EU',
    hours: 'Mon – Fri · 9:00 AM – 5:00 PM GMT',
    mapEmbed: 'London, UK',
    gradient: 'from-rose-500 to-pink-600',
    flag: '🇬🇧',
  },
];

const SOCIAL_LINKS = [
  { icon: TwitterIcon, label: 'Twitter / X', handle: '@LearnSphereAI', href: '#', color: 'hover:text-sky-500' },
  { icon: LinkedinIcon, label: 'LinkedIn', handle: 'LearnSphereAI', href: '#', color: 'hover:text-blue-600' },
  { icon: GithubIcon, label: 'GitHub', handle: 'learnsphereai', href: '#', color: 'hover:text-slate-900 dark:hover:text-white' },
];

const CONTACT_FAQS = [
  {
    question: 'How quickly will I receive a response to my enquiry?',
    answer: 'We aim to respond to all email enquiries within 24 business hours. Live chat is available Monday to Saturday from 9 AM to 6 PM IST for immediate assistance. Enterprise clients receive priority support with a dedicated account manager.',
  },
  {
    question: 'How can I report a technical issue with the platform?',
    answer: 'You can report technical issues through our Help Centre, via email at tech@learnsphereai.com, or by using the in-app feedback button available on every page. Please include your browser version, operating system, and a description of the issue for the fastest resolution.',
  },
{
  question: "I'm an educator interested in publishing courses. Who should I contact?",
  answer:
    "We'd love to have you on board! Please reach out to our Educator Relations team at educators@learnsphereai.com or fill in the contact form with 'Educator Partnership' as the subject. Our team typically responds within 48 hours with information about our vetting process, revenue share model, and onboarding support.",
},
  {
    question: 'Do you offer enterprise or institutional plans?',
    answer: 'Yes! We offer custom enterprise plans for companies, universities, and institutions with 10+ users. These include dedicated dashboards, custom branding, advanced analytics, and priority support. Contact us at enterprise@learnsphereai.com to schedule a free consultation.',
  },
  {
    question: 'How can I request a refund for a course purchase?',
    answer: 'We offer a full refund within 30 days of purchase if you are unsatisfied with a course, provided you have completed less than 30% of the course content. To initiate a refund, email billing@learnsphereai.com with your order ID. Our billing team will process approved refunds within 5–7 business days.',
  },
];

const SUBJECTS = [
  'General Enquiry',
  'Technical Support',
  'Billing & Payments',
  'Course Content Feedback',
  'Educator Partnership',
  'Enterprise / Institutional Plans',
  'Press & Media',
  'Other',
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionBadge = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
    <Sparkles size={12} />
    {children}
  </span>
);

const InputField = ({ label, id, required, children, error }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-rose-500">{error}</p>}
  </div>
);

const FAQItem = ({ faq, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      custom={index * 0.08}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{faq.question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-slate-400 dark:text-slate-500"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-6 pb-5 pt-0 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success'

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Please enter your full name.';
    if (!form.email.trim()) errs.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email address.';
    if (!form.subject) errs.subject = 'Please select a subject.';
    if (!form.message.trim()) errs.message = 'Please enter your message.';
    else if (form.message.trim().length < 20) errs.message = 'Message must be at least 20 characters.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setStatus('submitting');
    // Simulated API call (no backend)
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setStatus('success');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const inputBase =
    'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-white/[0.07]';
  const inputError = 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/[0.06]">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 blur-3xl opacity-60" />
          <div className="absolute -bottom-20 -left-32 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/30 blur-3xl opacity-50" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-24 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div variants={fadeIn} custom={0} initial="hidden" animate="visible" className="mb-6">
              <SectionBadge>Get In Touch</SectionBadge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              animate="visible"
              className="font-space-grotesk text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
            >
              We'd Love to{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 dark:from-indigo-400 dark:via-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                Hear From You
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              animate="visible"
              className="mt-6 text-lg sm:text-xl text-slate-500 dark:text-slate-400 leading-relaxed"
            >
              Whether you have a question, feedback, a partnership proposal, or just want to say hello — our team is here and ready to help.
            </motion.p>
          </div>

          {/* Contact Channel Cards */}
          <motion.div
            variants={fadeUp}
            custom={0.3}
            initial="hidden"
            animate="visible"
            className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {CONTACT_CHANNELS.map((channel, i) => {
              const Icon = channel.icon;
              return (
                <motion.a
                  key={channel.title}
                  href={channel.href}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`flex flex-col gap-3 rounded-2xl border ${channel.border} bg-white dark:bg-slate-900/80 p-6 shadow-sm hover:shadow-md transition-shadow group`}
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${channel.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{channel.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{channel.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                    {channel.value}
                    <ExternalLink size={13} />
                  </span>
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Contact Form + Info ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-5 gap-12">

          {/* Contact Form — 3 of 5 cols */}
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="lg:col-span-3"
          >
            <div className="rounded-3xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-8 lg:p-10 shadow-sm">
              <h2 className="mb-1 font-space-grotesk text-2xl font-bold text-slate-900 dark:text-white">Send Us a Message</h2>
              <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
                Fill in the form below and we'll get back to you within 24 business hours.
              </p>

              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center gap-4 py-16 text-center"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white font-space-grotesk">Message Sent!</h3>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Thank you for reaching out. We'll be in touch within 24 business hours.
                      </p>
                    </div>
                    <button
                      onClick={() => setStatus('idle')}
                      className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-5"
                  >
                    {/* Name + Email */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <InputField label="Full Name" id="name" required error={errors.name}>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          placeholder="Rohan Mehta"
                          value={form.name}
                          onChange={handleChange}
                          className={`${inputBase} ${errors.name ? inputError : ''}`}
                        />
                      </InputField>
                      <InputField label="Email Address" id="email" required error={errors.email}>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="rohan@example.com"
                          value={form.email}
                          onChange={handleChange}
                          className={`${inputBase} ${errors.email ? inputError : ''}`}
                        />
                      </InputField>
                    </div>

                    {/* Subject */}
                    <InputField label="Subject" id="subject" required error={errors.subject}>
                      <select
                        id="subject"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className={`${inputBase} ${errors.subject ? inputError : ''} cursor-pointer`}
                      >
                        <option value="">Select a subject…</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </InputField>

                    {/* Message */}
                    <InputField label="Message" id="message" required error={errors.message}>
                      <textarea
                        id="message"
                        name="message"
                        rows={6}
                        placeholder="Tell us how we can help you…"
                        value={form.message}
                        onChange={handleChange}
                        className={`${inputBase} resize-none ${errors.message ? inputError : ''}`}
                      />
                      <span className="text-right text-xs text-slate-400 dark:text-slate-600">
                        {form.message.length} / 2000
                      </span>
                    </InputField>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:shadow-xl active:scale-[0.98]"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Message
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Info Panel — 2 of 5 cols */}
          <motion.div
            variants={fadeUp}
            custom={0.15}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            {/* Contact Details */}
            <div className="rounded-3xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-8 shadow-sm">
              <h3 className="mb-6 font-space-grotesk text-lg font-bold text-slate-900 dark:text-white">Contact Details</h3>
              <div className="space-y-5">
                {[
                  { icon: Mail, label: 'General Enquiries', value: 'ritikamarotha9@gmail.com', href: 'mailto:ritikamarotha9@gmail.com' }, // { icon: Mail, label: 'General Enquiries', value: 'nsphereai.com', href: 'mailto:nsphereai.com' },
                  { icon: Mail, label: 'Technical Support', value: 'ritikamarotha9@gmail.com', href: 'mailto:ritikamarotha9@gmail.com' },
                  { icon: Phone, label: 'Phone (India)', value: '+91 80039*****', href: 'tel:+9180039*****' },
                  { icon: Clock, label: 'Business Hours', value: 'Mon–Sat, 9 AM–6 PM IST', href: null },
                ].map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
                      </div>
                    </div>
                  );
                  return item.href ? (
                    <a key={item.label} href={item.href} className="block hover:opacity-80 transition-opacity">
                      {content}
                    </a>
                  ) : (
                    <div key={item.label}>{content}</div>
                  );
                })}
              </div>
            </div>

            {/* Social Links */}
            <div className="rounded-3xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-8 shadow-sm">
              <h3 className="mb-5 font-space-grotesk text-lg font-bold text-slate-900 dark:text-white">Follow Us</h3>
              <div className="space-y-3">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 rounded-xl border border-slate-100 dark:border-white/[0.06] p-3 text-slate-500 dark:text-slate-400 ${social.color} transition-colors hover:border-current/20 hover:bg-slate-50 dark:hover:bg-white/[0.04] group`}
                    >
                      <Icon size={18} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{social.label}</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{social.handle}</p>
                      </div>
                      <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Office Locations ─────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 dark:border-white/[0.06] bg-white dark:bg-slate-900/60 py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <motion.div variants={fadeIn} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-4">
              <SectionBadge>Our Offices</SectionBadge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-space-grotesk text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"
            >
              Global Presence, Local Touch
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-4 text-slate-500 dark:text-slate-400 max-w-xl mx-auto"
            >
              We operate across three continents to support our learners and educators worldwide.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {OFFICES.map((office, i) => (
              <motion.div
                key={office.city}
                variants={fadeUp}
                custom={i * 0.1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className="rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Map Placeholder */}
                <div className={`relative h-44 bg-gradient-to-br ${office.gradient} flex items-center justify-center overflow-hidden`}>
                  {/* Stylised map-like grid */}
                  <div className="absolute inset-0 opacity-10">
                    <svg viewBox="0 0 400 180" className="w-full h-full" fill="none">
                      {[30, 60, 90, 120, 150].map((y) => (
                        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="white" strokeWidth="1" />
                      ))}
                      {[50, 100, 150, 200, 250, 300, 350].map((x) => (
                        <line key={x} x1={x} y1="0" x2={x} y2="180" stroke="white" strokeWidth="1" />
                      ))}
                    </svg>
                  </div>
                  <div className="relative flex flex-col items-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                      <MapPin size={28} className="text-white" />
                    </div>
                    <span className="font-space-grotesk text-2xl font-bold text-white">{office.flag} {office.city}</span>
                    <span className="text-xs font-medium text-white/70">{office.country}</span>
                  </div>
                  {/* Pin dot effect */}
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                    className="absolute bottom-8 right-8 h-4 w-4 rounded-full bg-white/30 border-2 border-white/60"
                  />
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="flex items-start gap-2.5 mb-3">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{office.address}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock size={15} className="shrink-0 text-slate-400" />
                    <p className="text-sm text-slate-500 dark:text-slate-500">{office.hours}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Google Maps Placeholder */}
          <motion.div
            variants={scaleIn}
            custom={0.2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-10 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm"
          >
            <div className="relative h-72 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
              {/* Stylised map background */}
              <div className="absolute inset-0">
                <svg viewBox="0 0 1200 288" className="w-full h-full opacity-30 dark:opacity-20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid lines */}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={i * 32} x2="1200" y2={i * 32} stroke="#94a3b8" strokeWidth="0.8" />
                  ))}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <line key={`v${i}`} x1={i * 63} y1="0" x2={i * 63} y2="288" stroke="#94a3b8" strokeWidth="0.8" />
                  ))}
                  {/* Road-like paths */}
                  <path d="M0 144 Q300 100 600 144 Q900 188 1200 144" stroke="#94a3b8" strokeWidth="3" />
                  <path d="M200 0 L200 288" stroke="#94a3b8" strokeWidth="2" />
                  <path d="M600 0 L600 288" stroke="#94a3b8" strokeWidth="3" />
                  <path d="M1000 0 L1000 288" stroke="#94a3b8" strokeWidth="2" />
                  {/* Blocks */}
                  <rect x="250" y="60" width="80" height="50" rx="4" fill="#cbd5e1" />
                  <rect x="350" y="80" width="60" height="40" rx="4" fill="#cbd5e1" />
                  <rect x="650" y="40" width="100" height="60" rx="4" fill="#cbd5e1" />
                  <rect x="770" y="70" width="70" height="45" rx="4" fill="#cbd5e1" />
                  <rect x="850" y="160" width="90" height="55" rx="4" fill="#cbd5e1" />
                </svg>
              </div>

              {/* Centre content */}
              <div className="relative flex flex-col items-center gap-4 text-center px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30">
                  <MapPin size={28} className="text-white" />
                </div>
                <div>
                  <p className="font-space-grotesk text-lg font-bold text-slate-900 dark:text-white">LearnSphereAI Headquarters</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Prestige Tech Park, Bangalore, India</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Marathahalli+Bangalore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25"
                >
                  Open in Google Maps
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Contact FAQs ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <motion.div variants={fadeIn} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-4">
              <SectionBadge>FAQs</SectionBadge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-space-grotesk text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"
            >
              Common Support Questions
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-4 text-slate-500 dark:text-slate-400"
            >
              Quick answers to the most common questions. Still need help?{' '}
              <a href="mailto:ritikamarotha9@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                Email us directly.
              </a>
            </motion.p>
          </div>

          <div className="space-y-3">
            {CONTACT_FAQS.map((faq, i) => (
              <FAQItem key={faq.question} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          variants={scaleIn}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 p-12 lg:p-16 text-center shadow-2xl shadow-indigo-500/25"
        >
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          </div>

          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
            >
              <MessageSquare size={30} className="text-white" />
            </motion.div>
            <h2 className="font-space-grotesk text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-indigo-100/80 text-lg max-w-xl mx-auto mb-10">
              Join over 120,000 learners already transforming their skills. Your first step starts here.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/course-list"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-all duration-200 shadow-lg shadow-black/10 active:scale-95"
              >
                Explore Courses
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all duration-200"
              >
                <Users size={16} />
                About Us
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;