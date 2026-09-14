import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/students/Loading';
import { assets } from '../../assets/assets';
import OutreachModal, { type OutreachTarget } from '../../components/admin/OutreachModal';

interface RiskData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  reasons: string[];
  recommendations: string[];
  daysSinceLastActivity: number | null;
  avgQuizScore: number | null;
  avgAssignmentScore: number | null;
}

/** Builds an AI-derived outreach draft from the student's risk data */
const buildOutreachDraft = (student: RiskData): OutreachTarget => {
  const reasonList = student.reasons.map(r => `• ${r}`).join('\n');
  const recList = student.recommendations.slice(0, 2).map(r => `• ${r}`).join('\n');
  const firstName = student.studentName.split(' ')[0];
  return {
    recipientId: student.studentId,
    recipientName: student.studentName,
    recipientEmail: student.studentEmail,
    context: 'student_risk',
    suggestedSubject: `We noticed you may need some support — ${firstName}`,
    suggestedMessage:
`Hi ${firstName},

We've noticed some signs that you might be falling behind in your courses and wanted to reach out personally.

${reasonList}

We'd love to help you get back on track. Here are a couple of things that might make a difference:

${recList}

If you have any questions or need support, please don't hesitate to reach out. We're here for you!

Warm regards,
LearnSphereAI Admin Team`,
  };
};

const StudentRisk = () => {
  const { backendURL, getToken } = useContext(AppContext);
  const [data, setData] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [outreachTarget, setOutreachTarget] = useState<OutreachTarget | null>(null);

  useEffect(() => { fetchRiskData(); }, []);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      const response = await axios.get(`${backendURL}/api/admin/student-risk`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch risk data');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch risk data';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => filter === 'All' || item.riskLevel === filter);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[50vh]">
        <img src={assets.cross_icon} alt="Error" className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Error Analyzing Risk</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">{error}</p>
        <button onClick={fetchRiskData} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {outreachTarget && (
        <OutreachModal target={outreachTarget} onClose={() => setOutreachTarget(null)} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            AI Student Risk Detection
            <span className="px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-md">BETA</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Powered by Google Gemini. Analyzing real-time behavior, course progress, and assignment scores to identify at-risk students.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-dk-surface p-1 rounded-lg border border-slate-200 dark:border-dk-border shadow-sm">
          {['All', 'High', 'Medium', 'Low'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dk-border/50'}`}
            >{f}</button>
          ))}
          <button onClick={fetchRiskData} title="Refresh" className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition">↻</button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredData.map((student) => {
          const isHigh = student.riskLevel === 'High';
          const isMedium = student.riskLevel === 'Medium';
          return (
            <div key={student.studentId}
              className={`rounded-2xl border bg-white dark:bg-dk-surface shadow-sm overflow-hidden flex flex-col
                ${isHigh ? 'border-red-200 dark:border-red-900/50' :
                  isMedium ? 'border-amber-200 dark:border-amber-900/50' : 'border-green-200 dark:border-green-900/50'}`}
            >
              {/* Card header */}
              <div className={`p-5 border-b
                ${isHigh ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' :
                  isMedium ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' :
                  'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate pr-2">{student.studentName}</h3>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex-shrink-0
                    ${isHigh ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      isMedium ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}
                  >{student.riskLevel} Risk</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.studentEmail}</p>
                <div className="mt-4 flex gap-3 text-xs">
                  <div className="flex-1 bg-white/60 dark:bg-black/20 p-2 rounded border border-black/5 dark:border-white/5">
                    <span className="block text-slate-500 dark:text-slate-400 mb-0.5">Last Active</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {student.daysSinceLastActivity !== null ? `${student.daysSinceLastActivity} days ago` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex-1 bg-white/60 dark:bg-black/20 p-2 rounded border border-black/5 dark:border-white/5">
                    <span className="block text-slate-500 dark:text-slate-400 mb-0.5">Avg Score</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {student.avgQuizScore !== null ? `${student.avgQuizScore}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Key Reasons</h4>
                  <ul className="space-y-1.5">
                    {student.reasons.map((r, i) => (
                      <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span className="leading-snug">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-dk-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">AI Recommendations</h4>
                  <ul className="space-y-1.5 mb-4">
                    {student.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                        <span className="text-blue-400 mt-0.5">→</span>
                        <span className="leading-snug">{r}</span>
                      </li>
                    ))}
                  </ul>
                  {/* ── Outreach button ── */}
                  <button
                    onClick={() => setOutreachTarget(buildOutreachDraft(student))}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                  >
                    <span>📬</span> Notify Student
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredData.length === 0 && !loading && !error && (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed rounded-xl border-slate-300 dark:border-dk-border">
          No students found matching the "{filter}" risk criteria.
        </div>
      )}
    </div>
  );
};

export default StudentRisk;
