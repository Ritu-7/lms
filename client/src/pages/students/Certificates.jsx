import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Award,
  BadgeCheck,
  CalendarDays,
  Download,
  Eye,
  FileCheck2,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Sparkles,
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import Footer from '../../components/students/Footer';
import CertificateViewer from '../../components/students/CertificateViewer';
import PortfolioGeneratorPanel from '../../components/students/ai/PortfolioGeneratorPanel';
import Button from '../../components/ui/Button';

const MotionDiv = motion.div;
const MotionArticle = motion.article;

const formatDate = (date) => {
  if (!date) return 'N/A';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'N/A';
  return parsedDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getCourseTitle = (certificate) => (
  certificate?.course?.courseTitle ||
  certificate?.courseTitle ||
  certificate?.courseName ||
  'Untitled Course'
);

const getStatusStyles = (status = 'active') => {
  const s = String(status || 'active').toLowerCase();
  if (['active', 'verified', 'valid', 'issued'].includes(s))
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-500/30';
  if (['revoked', 'expired', 'invalid'].includes(s))
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-500/30';
  return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-500/30';
};

const getDisplayStatus = (status = 'active') => {
  const s = String(status || 'active');
  if (s.toLowerCase() === 'active') return 'Verified';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const Certificates = () => {
  const navigate = useNavigate();
  const { backendURL, getToken, userData, enrolledCourses } = useContext(AppContext);

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingCertificate, setViewingCertificate] = useState(null);
  const [generating, setGenerating] = useState({});

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      if (!token) {
        setCertificates([]);
        setError('Please sign in to view your earned certificates.');
        return;
      }
      const { data } = await axios.get(`${backendURL}/api/certificates/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setCertificates(Array.isArray(data.certificates) ? data.certificates : []);
      } else {
        setError(data.message || 'Failed to load certificates.');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to load certificates.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [backendURL, getToken]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // Courses that don't yet have a certificate
  const coursesWithoutCertificate = useMemo(() => {
    if (!Array.isArray(enrolledCourses)) return [];
    const certCourseIds = new Set(
      certificates.map((c) => String(c.course?._id || c.course || '')).filter(Boolean)
    );
    return enrolledCourses.filter((c) => !certCourseIds.has(String(c._id)));
  }, [enrolledCourses, certificates]);

  const handleGenerate = async (courseId, courseTitle) => {
    try {
      setGenerating((prev) => ({ ...prev, [courseId]: true }));
      const token = await getToken();
      const { data } = await axios.post(
        `${backendURL}/api/certificates/generate`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(`🎉 Certificate issued for "${courseTitle}"!`);
        fetchCertificates();
      } else {
        toast.info(data.message || 'Could not issue certificate yet.');
      }
    } catch (err) {
      toast.info(err.response?.data?.message || 'Could not issue certificate yet. Complete all lessons first.');
    } finally {
      setGenerating((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleDownload = async (certificate) => {
    // Open viewer so user can download from there
    setViewingCertificate(certificate);
  };

  const handleVerify = (certificate) => {
    if (certificate.verificationCode) {
      navigate(`/certificate/verify/${certificate.verificationCode}`);
      return;
    }
    toast.info('Verification details are not available for this certificate.');
  };

  const stats = useMemo(() => {
    const verifiedCount = certificates.filter((c) =>
      ['active', 'verified', 'valid', 'issued'].includes(String(c.status || 'active').toLowerCase())
    ).length;
    return [
      { label: 'Learner', value: userData?.name || 'Student', color: 'text-slate-900 dark:text-dk-text', icon: Award },
      { label: 'Certificates', value: certificates.length, color: 'text-blue-600', icon: FileCheck2 },
      { label: 'Verified', value: verifiedCount, color: 'text-emerald-600', icon: ShieldCheck },
    ];
  }, [certificates, userData?.name]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dk-base">
      {/* Certificate Viewer Modal */}
      {viewingCertificate && (
        <CertificateViewer
          certificate={viewingCertificate}
          onClose={() => setViewingCertificate(null)}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">My Certificates</h1>
            <p className="text-slate-500 dark:text-dk-text-2 mt-2">View, download, and verify every certificate you have earned.</p>
          </div>
          <Button
            variant="primary"
            onClick={fetchCertificates}
            disabled={loading}
            className="shadow-lg shadow-blue-600/25"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </header>

        {/* Stats */}
        <div className="grid gap-6 mb-10 md:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <MotionDiv
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="interactive-card rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500 dark:text-dk-text-2">{stat.label}</p>
                  <Icon size={20} className={stat.color} />
                </div>
                <p className={`mt-2 text-3xl font-bold font-space-grotesk ${stat.color}`}>{stat.value}</p>
              </MotionDiv>
            );
          })}
        </div>

        <div className="mb-10">
          <PortfolioGeneratorPanel />
        </div>

        {/* Generate Certificate for completed courses without a cert */}
        {coursesWithoutCertificate.length > 0 && (
          <div className="mb-8 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-dk-text">Claim Your Certificate</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-dk-text-2 mb-4">
              If you've completed a course, click below to generate your certificate instantly.
            </p>
            <div className="flex flex-wrap gap-3">
              {coursesWithoutCertificate.map((course) => (
                <button
                  key={course._id}
                  onClick={() => handleGenerate(course._id, course.courseTitle)}
                  disabled={generating[course._id]}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-all active:scale-95"
                >
                  <Award size={14} />
                  {generating[course._id] ? 'Checking…' : `"${course.courseTitle}"`}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm animate-pulse">
                <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-dk-surface-2" />
                <div className="mt-5 h-5 w-3/4 rounded bg-slate-200 dark:bg-dk-surface-2" />
                <div className="mt-3 h-4 w-1/2 rounded bg-slate-200 dark:bg-dk-surface-2" />
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="h-10 rounded-xl bg-slate-200 dark:bg-dk-surface-2" />
                  <div className="h-10 rounded-xl bg-slate-200 dark:bg-dk-surface-2" />
                  <div className="h-10 rounded-xl bg-slate-200 dark:bg-dk-surface-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-8 text-center">
            <TriangleAlert className="mx-auto text-rose-500" size={44} />
            <h2 className="mt-4 text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Could not load certificates</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-dk-text-2">{error}</p>
            <button onClick={fetchCertificates} className="mt-6 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-all">
              Try Again
            </button>
          </div>
        ) : certificates.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-dk-border bg-white dark:bg-dk-surface p-10 sm:p-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
              <Award size={38} />
            </div>
            <h2 className="mt-6 text-2xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">No certificates earned yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-dk-text-2">
              Complete your enrolled courses to unlock verified certificates that you can share, download, and validate online.
            </p>
            <button
              onClick={() => navigate('/my-enrollments')}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/25"
            >
              <FileCheck2 size={16} />
              Continue Learning
            </button>
          </div>
        ) : (
          <>
            {/* Card grid */}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {certificates.map((certificate, index) => (
                <MotionArticle
                  key={certificate._id || certificate.certificateId || index}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl overflow-hidden"
                >
                  {/* Top accent */}
                  <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #818cf8)" }} />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                        <Award size={24} />
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(certificate.status)}`}>
                        {getDisplayStatus(certificate.status || 'active')}
                      </span>
                    </div>

                    <h2 className="mt-5 text-base font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Certificate of Completion</h2>
                    <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">{getCourseTitle(certificate)}</p>

                    <div className="mt-4 space-y-2 rounded-xl bg-slate-50 dark:bg-dk-surface p-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-dk-text-2">
                        <CalendarDays size={13} className="text-blue-500" />
                        <span>Issued {formatDate(certificate.issueDate || certificate.createdAt)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-dk-text-2">
                        <BadgeCheck size={13} className="mt-0.5 text-emerald-500" />
                        <span className="break-all font-mono">{certificate.verificationCode || certificate.certificateId || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setViewingCertificate(certificate)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-2 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
                      >
                        <Eye size={13} />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(certificate)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-dk-border px-2 py-2.5 text-xs font-semibold text-slate-700 dark:text-dk-text transition-all hover:bg-slate-50 dark:hover:bg-dk-surface-2"
                      >
                        <Download size={13} />
                        PDF
                      </button>
                      <button
                        onClick={() => handleVerify(certificate)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
                      >
                        <ShieldCheck size={13} />
                        Verify
                      </button>
                    </div>
                  </div>
                </MotionArticle>
              ))}
            </div>

            {/* Desktop table */}
            <div className="mt-8 hidden xl:block rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-dk-border">
                <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">All Certificates</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-dk-surface text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">Certificate</th>
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Issue Date</th>
                      <th className="px-6 py-4">Verification Code</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {certificates.map((certificate, index) => (
                      <tr key={certificate._id || certificate.certificateId || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                              <Award size={22} />
                            </div>
                            <div>
                              <h2 className="font-semibold text-slate-900 dark:text-dk-text">Certificate of Completion</h2>
                              <p className="mt-1 text-xs text-slate-500 dark:text-dk-text-2">ID: {certificate.certificateId || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-600 dark:text-dk-text-2">{getCourseTitle(certificate)}</td>
                        <td className="px-6 py-5 text-slate-600 dark:text-dk-text-2">{formatDate(certificate.issueDate || certificate.createdAt)}</td>
                        <td className="px-6 py-5">
                          <span className="block max-w-[220px] truncate font-mono text-xs text-slate-600 dark:text-dk-text-2" title={certificate.verificationCode}>
                            {certificate.verificationCode || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(certificate.status)}`}>
                            {getDisplayStatus(certificate.status || 'active')}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setViewingCertificate(certificate)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700">View</button>
                            <button onClick={() => handleDownload(certificate)} className="rounded-xl border border-slate-200 dark:border-dk-border px-4 py-2 text-xs font-semibold text-slate-700 dark:text-dk-text transition-all hover:bg-slate-50 dark:hover:bg-dk-surface-2">Download PDF</button>
                            <button onClick={() => handleVerify(certificate)} className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-950/40">Verify</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Certificates;
