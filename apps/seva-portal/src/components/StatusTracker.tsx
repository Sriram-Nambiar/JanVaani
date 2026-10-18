import React, { useState, useEffect } from 'react';
import { BmtcApplicationResponse } from '../types';

interface StatusTrackerProps {
  initialAppId?: string;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({ initialAppId }) => {
  const [appId, setAppId] = useState(initialAppId || '');
  const [loading, setLoading] = useState(false);
  const [appData, setAppData] = useState<BmtcApplicationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async (idToFetch: string) => {
    if (!idToFetch.trim()) {
      setErrorMsg('Please enter a valid Application ID.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(idToFetch.trim())}`);
      if (!res.ok) {
        if (res.status === 404) {
          setErrorMsg(`Application ID "${idToFetch.trim()}" not found in Seva Sindhu database.`);
        } else {
          setErrorMsg('Failed to fetch status. Please verify the Application ID.');
        }
        setAppData(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAppData(data);
    } catch {
      setErrorMsg('Could not reach Seva Sindhu API (Port 3002). Make sure apps/seva-api is running.');
      setAppData(null);
    } finally {
      setLoading(false);
    }
  };

  const [copied, setCopied] = useState(false);
  const handleCopyId = async () => {
    if (!appData?.applicationId) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(appData.applicationId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Graceful fallback if clipboard access is denied in non-secure contexts
      setCopied(false);
    }
  };

  useEffect(() => {
    if (initialAppId) {
      setAppId(initialAppId);
      fetchStatus(initialAppId);
    }
  }, [initialAppId]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Search Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="max-w-xl">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
            Seva Sindhu Online Tracking
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Track Citizen Application Status
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Enter your Seva Sindhu Application Reference Number (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">SEVA-DEMO-...</code>) to check live progress.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchStatus(appId);
          }}
          className="mt-5 flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="Enter Application ID (e.g. SEVA-DEMO-1740000000-A1B2C)"
            className="flex-1 px-4 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-all shadow-xs"
          >
            {loading ? 'Searching...' : 'Check Status'}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* Result Card */}
      {appData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-amber-400 block font-bold">
                {appData.applicationId}
              </span>
              <h3 className="text-base font-bold mt-0.5">{appData.serviceName}</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500 text-slate-950">
              {appData.status}
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Processing Lifecycle Timeline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              <div className="p-3 bg-white rounded-lg border-2 border-emerald-500 shadow-xs">
                <span className="text-xs font-bold text-emerald-600 block">✓ Step 1: Submitted</span>
                <p className="text-[11px] text-slate-600 mt-1">Application recorded in portal database.</p>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  {new Date(appData.submittedAt).toLocaleTimeString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-blue-500 shadow-xs">
                <span className="text-xs font-bold text-blue-600 block">⏳ Step 2: Verification</span>
                <p className="text-[11px] text-slate-600 mt-1">College bonafide & Aadhaar verified.</p>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 block">In Progress</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 opacity-60">
                <span className="text-xs font-semibold text-slate-700 block">Step 3: Route Approval</span>
                <p className="text-[11px] text-slate-500 mt-1">BMTC Central Division sanction.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Pending</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 opacity-60">
                <span className="text-xs font-semibold text-slate-700 block">Step 4: Smart Card Pass</span>
                <p className="text-[11px] text-slate-500 mt-1">Digital QR pass issuance.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Pending</span>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500 text-xs block">Applicant</span>
              <strong className="text-slate-900">{appData.applicant.studentName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Masked Aadhaar</span>
              <strong className="text-slate-900 font-mono">{appData.applicant.aadhaarMasked}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">College / University</span>
              <strong className="text-slate-900">{appData.applicant.institutionName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Course & Year</span>
              <strong className="text-slate-900">{appData.applicant.course}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Pickup Origin</span>
              <strong className="text-blue-900 font-semibold">{appData.applicant.pickupStop}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Destination Stop</span>
              <strong className="text-blue-900 font-semibold">{appData.applicant.destinationStop}</strong>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <span className="text-slate-500 text-xs block font-semibold">Official Remarks</span>
              <p className="text-slate-700 text-xs italic mt-0.5">{appData.acknowledgement}</p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Copy Application Reference ID"
                onClick={handleCopyId}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-all text-slate-700 shadow-2xs"
              >
                {copied ? '✓ Copied ID' : '📋 Copy Reference ID'}
              </button>
              <button
                type="button"
                aria-label="Print Application Acknowledgement Slip"
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-all text-slate-700 shadow-2xs"
              >
                🖨️ Print Acknowledgement Slip
              </button>
            </div>
            <a
              href={(import.meta as any).env?.VITE_JANVAANI_WEB_URL || 'http://localhost:5173'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-900 hover:text-blue-700 underline flex items-center gap-1"
            >
              Verify in JanVaani Assistant ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
