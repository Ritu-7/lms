/**
 * OutreachModal.tsx
 *
 * Shared modal for admin-initiated outreach to students or educators.
 * Features:
 *  - Shows AI-generated draft (passed in as prop)
 *  - Admin can edit the subject and message before sending
 *  - Channel selection: Email / Platform Notification / Both
 *  - Confirmation step before actually sending
 *  - Delivery status feedback via toast
 *  - Duplicate send prevention (backend dedup + frontend disabled state)
 */

import { useState, useContext, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'

export interface OutreachTarget {
  /** MongoDB User _id */
  recipientId: string
  recipientName: string
  recipientEmail: string
  /** AI-generated subject suggestion */
  suggestedSubject: string
  /** AI-generated body suggestion */
  suggestedMessage: string
  /** Context tag used for backend deduplication */
  context: 'student_risk' | 'educator_insights'
}

interface Props {
  target: OutreachTarget
  onClose: () => void
}

type Channel = 'email' | 'notification' | 'both'

const CHANNEL_OPTIONS: { value: Channel; label: string; icon: string; desc: string }[] = [
  { value: 'notification', label: 'Platform Notification', icon: '🔔', desc: 'Shows in their notification centre immediately' },
  { value: 'email',        label: 'Email',                 icon: '✉️', desc: 'Sends to their registered email address' },
  { value: 'both',         label: 'Both',                  icon: '📡', desc: 'Email + in-app notification' },
]

const OutreachModal = ({ target, onClose }: Props) => {
  const { backendURL, getToken } = useContext(AppContext)

  const [subject, setSubject] = useState(target.suggestedSubject)
  const [message, setMessage] = useState(target.suggestedMessage)
  const [channel, setChannel] = useState<Channel>('notification')
  const [step, setStep] = useState<'compose' | 'confirm' | 'done'>('compose')
  const [sending, setSending] = useState(false)
  const [deliveryDetails, setDeliveryDetails] = useState<{
    emailStatus: string
    notificationStatus: string
    errors?: string[]
  } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 320)}px`
  }, [message])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSend = async () => {
    setSending(true)
    try {
      const token = await getToken()
      const res = await axios.post(
        `${backendURL}/api/admin/send-outreach`,
        {
          recipientId: target.recipientId,
          subject: subject.trim(),
          message: message.trim(),
          channels: channel,
          context: target.context,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (res.data.success) {
        setDeliveryDetails(res.data.details)
        setStep('done')

        // Show delivery summary toast
        const { emailStatus, notificationStatus } = res.data.details
        const channelSummary = [
          emailStatus === 'sent' ? '✉️ Email sent' : emailStatus === 'failed' ? '✉️ Email failed' : null,
          notificationStatus === 'sent' ? '🔔 Notification sent' : notificationStatus === 'failed' ? '🔔 Notification failed' : null,
        ].filter(Boolean).join(' · ')
        toast.success(`Message delivered: ${channelSummary}`)

        // Auto-close after 2.5s
        setTimeout(onClose, 2500)
      } else {
        throw new Error(res.data.message || 'Send failed')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send'
      toast.error(msg)
      // If it was a dedup 429, go back to compose
      if (err.response?.status === 429) setStep('compose')
    } finally {
      setSending(false)
    }
  }

  const selectedChannelInfo = CHANNEL_OPTIONS.find(c => c.value === channel)!

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          onClick={e => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-dk-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-dk-border overflow-hidden"
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📬</span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Admin Outreach</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  Message to {target.recipientName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dk-border transition"
            >
              ✕
            </button>
          </div>

          {/* ── DONE STATE ── */}
          {step === 'done' && deliveryDetails && (
            <div className="flex-1 min-h-0 p-8 flex flex-col items-center gap-4 text-center overflow-y-auto">
              <span className="text-5xl">✅</span>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Message Sent!</h3>
              <div className="flex gap-4 text-sm">
                {deliveryDetails.emailStatus !== 'skipped' && (
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${
                    deliveryDetails.emailStatus === 'sent'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    ✉️ Email {deliveryDetails.emailStatus}
                  </span>
                )}
                {deliveryDetails.notificationStatus !== 'skipped' && (
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${
                    deliveryDetails.notificationStatus === 'sent'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    🔔 Notification {deliveryDetails.notificationStatus}
                  </span>
                )}
              </div>
              {deliveryDetails.errors && deliveryDetails.errors.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 max-w-sm">{deliveryDetails.errors.join(' · ')}</p>
              )}
              <p className="text-xs text-slate-400">This window will close automatically…</p>
            </div>
          )}

          {/* ── CONFIRM STATE ── */}
          {step === 'confirm' && (
            <div className="flex-1 min-h-0 p-6 space-y-5 overflow-y-auto">
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
                <p className="font-semibold mb-1">⚠️ Confirm before sending</p>
                <p>This will send a real message to <strong>{target.recipientEmail}</strong>. Please review the details below.</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 w-24 shrink-0">To:</span>
                  <span className="text-slate-800 dark:text-slate-200">{target.recipientName} ({target.recipientEmail})</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 w-24 shrink-0">Via:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedChannelInfo.icon} {selectedChannelInfo.label}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 w-24 shrink-0">Subject:</span>
                  <span className="text-slate-800 dark:text-slate-200">{subject}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 w-24 shrink-0">Message:</span>
                  <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-6">{message}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('compose')}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dk-border text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dk-surface-2 transition disabled:opacity-50"
                >
                  ← Edit
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Sending…</>
                  ) : (
                    <>Send Now ✓</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── COMPOSE STATE ── */}
          {step === 'compose' && (
            <div className="flex-1 min-h-0 p-6 space-y-5 overflow-y-auto">
              {/* Recipient */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-dk-surface-2 px-4 py-3 rounded-xl">
                <span className="text-lg">👤</span>
                <div className="text-sm">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{target.recipientName}</p>
                  <p className="text-slate-500 dark:text-slate-400">{target.recipientEmail}</p>
                </div>
                <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full font-semibold uppercase tracking-wide">
                  {target.context === 'student_risk' ? 'At-Risk Student' : 'Educator'}
                </span>
              </div>

              {/* Channel picker */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Send via</p>
                <div className="grid grid-cols-3 gap-2">
                  {CHANNEL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setChannel(opt.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all text-xs ${
                        channel === opt.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm'
                          : 'border-slate-200 dark:border-dk-border text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dk-surface-2'
                      }`}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <span className="font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">{selectedChannelInfo.desc}</p>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Subject</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={120}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition"
                  placeholder="Message subject…"
                />
              </div>

              {/* Message body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Message</label>
                  <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">✦ AI-generated draft — edit freely</span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition resize-none leading-relaxed"
                  placeholder="Write your message…"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dk-border text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dk-surface-2 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!subject.trim() || !message.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review & Send →
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default OutreachModal
