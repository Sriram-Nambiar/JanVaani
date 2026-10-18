import React, { useEffect, useState } from 'react';
import { BmtcApplicationResponse } from '../types';

interface ApplicationsListProps {
  onSelectApplication: (id: string) => void;
  onRefreshTrigger?: number;
}

export const ApplicationsList: React.FC<ApplicationsListProps> = ({
  onSelectApplication,
  onRefreshTrigger = 0,
}) => {
  const [applications, setApplications] = useState<BmtcApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/applications');
      if (!res.ok) {
        throw new Error('Failed to fetch applications');
      }
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {
      setErrorMsg('Unable to fetch applications from Seva API (Port 3002).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [onRefreshTrigger]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
        <div>
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
            Central Registry (Port 3002 Database)
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Submitted BMTC Student Pass Applications
          </h2>
          <p className="text-xs text-slate-600">
            Real-time feed of applications received via Seva Sindhu Portal & JanVaani AI Assistant.
          </p>
        </div>

        <button
          onClick={loadApplications}
          className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          🔄 Refresh Feed
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          Loading applications from Seva API...
        </div>
      ) : errorMsg ? (
        <div className="p-6 text-center text-red-600 text-sm">
          ⚠️ {errorMsg}
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-3">
          <p className="text-base font-semibold">No applications submitted yet.</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Submit an application using the portal form above or ask JanVaani AI Assistant via WhatsApp chat!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Institution & Course</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.applicationId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-900 text-xs">
                    {app.applicationId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{app.applicant.studentName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{app.applicant.aadhaarMasked}</div>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <div className="font-medium text-slate-800">{app.applicant.institutionName}</div>
                    <div className="text-slate-500">{app.applicant.course}</div>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <span className="font-medium text-slate-800">{app.applicant.pickupStop}</span>
                    <span className="text-slate-400 mx-1">→</span>
                    <span className="font-medium text-slate-800">{app.applicant.destinationStop}</span>
                  </td>
                  <td className="py-3 px-4">
                    {app.source === 'JANVAANI_AI' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                        🤖 JanVaani AI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                        💻 Seva Portal
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectApplication(app.applicationId)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-900 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                    >
                      View Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
