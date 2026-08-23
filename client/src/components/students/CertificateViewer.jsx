import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, Share2, Award, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

/**
 * Beautiful in-browser certificate viewer rendered via React Portal.
 * Portal ensures the modal escapes any parent stacking context (navbar, sidebar, etc.)
 * so it always covers the full viewport.
 */
const CertificateViewer = ({ certificate, onClose }) => {
  const certRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const element = certRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${certificate.certificateId || "certificate"}.pdf`);
      toast.success("Certificate downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const url =
      certificate.verificationUrl ||
      `${window.location.origin}/certificate/verify/${certificate.verificationCode}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Verification link copied to clipboard!");
    } catch {
      toast.info(`Verification link: ${url}`);
    }
  };

  const snap = certificate.completionSnapshot || {};

  const modal = (
    /* Backdrop — rendered directly in <body> via portal */
    <div
      style={{ position: "fixed", inset: 0, zIndex: 99999 }}
      className="flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Scroll container so content never clips on small screens */}
      <div
        className="w-full h-full overflow-y-auto flex items-center justify-center py-6 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full max-w-5xl flex flex-col gap-4 mx-auto">

          {/* ── Action bar ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Award size={20} className="text-blue-400" />
              <span className="text-white font-semibold text-sm">Certificate of Completion</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-all"
              >
                <Share2 size={14} />
                Share
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-all"
              >
                <Download size={14} className={downloading ? "animate-bounce" : ""} />
                {downloading ? "Generating PDF…" : "Download PDF"}
              </button>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-600 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Certificate card ────────────────────────────────────── */}
          <div
            ref={certRef}
            className="relative overflow-hidden rounded-2xl w-full"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
              border: "3px solid #2563eb",
              /* fixed height so it stays proportional and visible */
              minHeight: "420px",
            }}
          >
            {/* Corner decorations */}
            {["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4"].map((pos, i) => (
              <div
                key={i}
                className={`absolute ${pos} w-10 h-10 rounded-full border-2 border-blue-800 flex items-center justify-center pointer-events-none`}
              >
                <div className="w-5 h-5 rounded-full border border-blue-600" />
              </div>
            ))}

            {/* Inner border frame */}
            <div className="absolute inset-3 rounded-xl border border-slate-700/60 pointer-events-none" />

            {/* Top gradient bar */}
            <div
              className="w-full"
              style={{ height: "6px", background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #818cf8, #3b82f6, #1d4ed8)" }}
            />

            {/* Content */}
            <div className="flex flex-col items-center px-10 py-6 gap-3">

              {/* Platform */}
              <p className="text-blue-400 text-[11px] font-bold tracking-[0.3em] uppercase text-center">
                LearnSphereAI &nbsp;·&nbsp; Online Learning Platform
              </p>

              <div className="w-40 h-px" style={{ background: "linear-gradient(90deg, transparent, #1e40af, transparent)" }} />

              {/* Title label */}
              <p className="text-slate-300 text-xs font-medium tracking-[0.18em] uppercase">
                Certificate of Completion
              </p>

              {/* Recipient name */}
              <h1
                className="text-white font-bold text-center leading-tight"
                style={{ fontSize: "clamp(22px, 3.5vw, 40px)" }}
              >
                {certificate.studentName || "Learner"}
              </h1>

              <p className="text-slate-400 text-sm text-center">
                has successfully completed the course
              </p>

              {/* Course title — gradient text */}
              <h2
                className="text-center font-bold leading-snug"
                style={{
                  fontSize: "clamp(15px, 2.2vw, 24px)",
                  background: "linear-gradient(90deg, #38bdf8, #818cf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {certificate.courseTitle || "Course"}
              </h2>

              {/* Divider */}
              <div
                className="w-full"
                style={{ height: "1px", background: "linear-gradient(90deg, transparent, #334155, transparent)", margin: "4px 0" }}
              />

              {/* Details row */}
              <div className="w-full grid grid-cols-3 gap-4">
                {/* Left — dates */}
                <div className="flex flex-col items-start gap-1">
                  <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Issued On</p>
                  <p className="text-slate-200 text-xs font-semibold">{formatDate(certificate.issueDate)}</p>
                  {snap.completedCount !== undefined && (
                    <>
                      <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-1">Lessons Completed</p>
                      <p className="text-slate-200 text-xs font-semibold">
                        {snap.completedCount} / {snap.totalLessons} ({snap.completionPercentage || 100}%)
                      </p>
                    </>
                  )}
                </div>

                {/* Center — signature */}
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="w-24 h-px bg-blue-600" />
                  <p className="text-slate-200 text-xs font-bold">LearnSphereAI</p>
                  <p className="text-slate-500 text-[9px] tracking-widest uppercase">Authorized Signature</p>
                  <div className="flex items-center gap-1 text-emerald-400 mt-1">
                    <CheckCircle size={11} />
                    <span className="text-[10px] font-semibold">Verified Certificate</span>
                  </div>
                </div>

                {/* Right — IDs */}
                <div className="flex flex-col items-end gap-1">
                  <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Certificate ID</p>
                  <p className="text-slate-200 text-xs font-semibold break-all text-right">{certificate.certificateId}</p>
                  <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-1">Verification Code</p>
                  <p className="text-blue-400 text-[10px] font-mono break-all text-right">{certificate.verificationCode}</p>
                </div>
              </div>

              {/* Verify URL */}
              <p className="text-slate-600 text-[9px] text-center mt-1">
                Verify at:{" "}
                {certificate.verificationUrl ||
                  `${window.location.origin}/certificate/verify/${certificate.verificationCode}`}
              </p>
            </div>

            {/* Bottom gradient bar */}
            <div
              className="w-full"
              style={{ height: "6px", background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #818cf8, #3b82f6, #1d4ed8)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render into document.body to escape all stacking contexts
  return createPortal(modal, document.body);
};

export default CertificateViewer;
