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
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import Footer from '../../components/students/Footer';

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

const getCertificateName = (certificate) => (
  certificate?.certificateName ||
  certificate?.title ||
  `Certificate of Completion`
);

const getStatusStyles = (status = 'active') => {
  const normalizedStatus = String(status || 'active').toLowerCase();

  if (['active', 'verified', 'valid', 'issued'].includes(normalizedStatus)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-500/30';
  }

  if (['revoked', 'expired', 'invalid'].includes(normalizedStatus)) {
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-500/30';
  }

  return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-500/30';
};

const getDisplayStatus = (status = 'active') => {
  const normalizedStatus = String(status || 'active');
  if (normalizedStatus.toLowerCase() === 'active') return 'Verified';
  return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
};

const Certificates = () => {
  const navigate = useNavigate();
  const { backendURL, getToken, userData } = useContext(AppContext);

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const stats = useMemo(() => {
    const verifiedCount = certificates.filter((certificate) => (
      ['active', 'verified', 'valid', 'issued'].includes(String(certificate.status || 'active').toLowerCase())
    )).length;

    return [
      { label: 'Learner', value: userData?.name || 'Student', color: 'text-slate-900', icon: Award },
      { label: 'Certificates', value: certificates.length, color: 'text-blue-600', icon: FileCheck2 },
      { label: 'Verified', value: verifiedCount, color: 'text-emerald-600', icon: ShieldCheck },
    ];
  }, [certificates, userData?.name]);

  const handleDownload = async (certificate) => {
    const certificateId = certificate.certificateId || certificate._id;

    if (!certificateId) {
      toast.info('Download is not available for this certificate.');
      return;
    }

    try {
      const token = await getToken();
      const downloadUrl = certificate.downloadUrl || `${backendURL}/api/certificates/${certificateId}/download`;
      const resolvedDownloadUrl = downloadUrl.startsWith('http') ? downloadUrl : `${backendURL}${downloadUrl}`;

      const response = await axios.get(resolvedDownloadUrl, {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to download certificate.');
    }
  };

  const handleView = (certificate) => {
    if (certificate.verificationCode) {
      navigate(`/certificate/verify/${certificate.verificationCode}`);
      return;
    }

    toast.info('Verification code is not available for this certificate.');
  };

  const handleVerify = (certificate) => {
    if (certificate.verificationCode) {
      navigate(`/certificate/verify/${certificate.verificationCode}`);
      return;
    }

    if (certificate.verificationUrl) {
      window.open(certificate.verificationUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    toast.info('Verification details are not available for this certificate.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-white">My Certificates</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">View, download, and verify every certificate you have earned.</p>
          </div>
          <button
            onClick={fetchCertificates}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 transition-all active:scale-95 shadow-lg shadow-blue-600/25"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </header>

        <div className="grid gap-6 mb-10 md:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <MotionDiv
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <Icon size={20} className={`${stat.color} dark:text-white`} />
                </div>
                <p className={`mt-2 text-3xl font-bold font-space-grotesk ${stat.color} dark:text-white`}>{stat.value}</p>
              </MotionDiv>
            );
          })}
        </div>

        {loading ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:hidden">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm animate-pulse">
                  <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-5 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden xl:block rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-pulse">
              <div className="p-6 border-b border-slate-200 dark:border-white/10">
                <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              {[...Array(5)].map((_, index) => (
                <div key={index} className="grid grid-cols-6 gap-6 border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                  <div className="col-span-2 h-5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-8 text-center">
            <TriangleAlert className="mx-auto text-rose-500" size={44} />
            <h2 className="mt-4 text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Could not load certificates</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button onClick={fetchCertificates} className="mt-6 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-all">
              Try Again
            </button>
          </div>
        ) : certificates.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 p-10 sm:p-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
              <Award size={38} />
            </div>
            <h2 className="mt-6 text-2xl font-bold font-space-grotesk text-slate-900 dark:text-white">No certificates earned yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
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
            <div className="grid gap-6 xl:hidden">
              {certificates.map((certificate, index) => (
                <MotionArticle
                  key={certificate._id || certificate.certificateId || index}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                      <Award size={24} />
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(certificate.status)}`}>
                      {getDisplayStatus(certificate.status || 'active')}
                    </span>
                  </div>

                  <h2 className="mt-5 text-lg font-bold font-space-grotesk text-slate-900 dark:text-white">{getCertificateName(certificate)}</h2>
                  <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">{getCourseTitle(certificate)}</p>

                  <div className="mt-5 space-y-3 rounded-xl bg-slate-50 dark:bg-white/5 p-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <CalendarDays size={16} className="text-blue-600 dark:text-blue-300" />
                      <span>Issued {formatDate(certificate.issueDate || certificate.createdAt)}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <BadgeCheck size={16} className="mt-0.5 text-emerald-600 dark:text-emerald-300" />
                      <span className="break-all">{certificate.verificationCode || certificate.certificateId || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <button onClick={() => handleView(certificate)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700">
                      <Eye size={14} />
                      View
                    </button>
                    <button onClick={() => handleDownload(certificate)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-white/5">
                      <Download size={14} />
                      PDF
                    </button>
                    <button onClick={() => handleVerify(certificate)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-950/40">
                      <ShieldCheck size={14} />
                      Verify
                    </button>
                  </div>
                </MotionArticle>
              ))}
            </div>

            <div className="hidden xl:block rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Earned Certificates</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs">
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
                              <h2 className="font-semibold text-slate-900 dark:text-white">{getCertificateName(certificate)}</h2>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ID: {certificate.certificateId || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-600 dark:text-slate-400">{getCourseTitle(certificate)}</td>
                        <td className="px-6 py-5 text-slate-600 dark:text-slate-400">{formatDate(certificate.issueDate || certificate.createdAt)}</td>
                        <td className="px-6 py-5">
                          <span className="block max-w-[220px] truncate font-mono text-xs text-slate-600 dark:text-slate-400" title={certificate.verificationCode || certificate.certificateId || 'N/A'}>
                            {certificate.verificationCode || certificate.certificateId || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(certificate.status)}`}>
                            {getDisplayStatus(certificate.status || 'active')}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleView(certificate)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700">
                              View
                            </button>
                            <button onClick={() => handleDownload(certificate)} className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-white/5">
                              Download PDF
                            </button>
                            <button onClick={() => handleVerify(certificate)} className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-950/40">
                              Verify
                            </button>
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