import React, { useState } from 'react';
import { BmtcApplicationResponse } from '../types';

interface SubmissionSuccessProps {
  data: BmtcApplicationResponse;
  onTrack: (id: string) => void;
  onNewApplication: () => void;
}

export const SubmissionSuccess: React.FC<SubmissionSuccessProps> = ({
  data,
  onTrack,
  onNewApplication,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(data.applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success banner */}
      <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
          ✓
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-4">
          Application Submitted Successfully!
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">
          Your BMTC Concessional Student Bus Pass application has been registered with Seva Sindhu Portal.
        </p>

        {/* Application ID Card */}
        <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 bg-white px-5 py-3.5 rounded-xl border border-emerald-300 shadow-xs">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Official Application ID
            </span>
            <span className="text-lg sm:text-xl font-mono font-black text-blue-900 tracking-wider">
              {data.applicationId}
            </span>
          </div>
          <button
            onClick={handleCopyId}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-all flex items-center gap-1.5"
          >
            {copied ? '✓ Copied' : '📋 Copy ID'}
          </button>
        </div>
      </div>

      {/* Acknowledgement Slip Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              Government of Karnataka • Seva Sindhu
            </div>
            <h3 className="text-base font-bold">Official e-Acknowledgement Receipt</h3>
          </div>
          <div className="text-right">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black uppercase tracking-wider">
              {data.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-slate-500 text-xs block">Service Name</span>
              <strong className="text-slate-900">{data.serviceName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Submission Timestamp</span>
              <strong className="text-slate-900 font-mono">
                {new Date(data.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Applicant Name</span>
              <strong className="text-slate-900">{data.applicant.studentName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Aadhaar (Masked)</span>
              <strong className="text-slate-900 font-mono">{data.applicant.aadhaarMasked}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-slate-500 text-xs block">College / Institution</span>
              <strong className="text-slate-900">{data.applicant.institutionName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Course & Year</span>
              <strong className="text-slate-900">{data.applicant.course}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Pickup Origin Stop</span>
              <strong className="text-blue-900">{data.applicant.pickupStop}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Destination Stop</span>
              <strong className="text-blue-900">{data.applicant.destinationStop}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-xs block font-medium">Portal Server Acknowledgement</span>
            <p className="mt-1 text-slate-700 italic text-xs leading-relaxed">
              "{data.acknowledgement}"
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-all flex items-center gap-1.5"
          >
            🖨️ Print Slip
          </button>

          <div className="flex gap-2">
            <button
              onClick={onNewApplication}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-all"
            >
              + New Application
            </button>
            <button
              onClick={() => onTrack(data.applicationId)}
              className="px-5 py-2 rounded-lg bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-all shadow-xs"
            >
              🔍 Track Status →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
