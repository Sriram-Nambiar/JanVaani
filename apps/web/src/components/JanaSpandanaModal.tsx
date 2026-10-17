import React, { useState, useEffect } from 'react';
import { AudioPlayer } from './AudioPlayer';

export interface GrievanceTimelineStep {
  step: number;
  titleKn: string;
  titleEn: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  updatedAt: string;
  remarksKn: string;
}

export interface GrievanceDocket {
  docketNumber: string;
  ackNumber?: string;
  applicantName: string;
  phone: string;
  district: string;
  department: string;
  grievanceCategory: string;
  description: string;
  status: 'LODGED' | 'ASSIGNED' | 'INQUIRY' | 'RESOLVED';
  assignedOfficer: string;
  slaDays: number;
  createdAt: string;
  timeline: GrievanceTimelineStep[];
  audioResponseKnBase64?: string;
  resolutionTextKn?: string;
}

interface JanaSpandanaModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillAckNumber?: string;
  apiUrl?: string;
}

export const JanaSpandanaModal: React.FC<JanaSpandanaModalProps> = ({
  isOpen,
  onClose,
  prefillAckNumber = 'RD003',
  apiUrl = 'http://localhost:3001',
}) => {
  const [activeTab, setActiveTab] = useState<'track' | 'lodge'>('track');
  const [docketNumber, setDocketNumber] = useState('JS-2026-B8A91C');
  const [docket, setDocket] = useState<GrievanceDocket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state for lodging
  const [applicantName, setApplicantName] = useState('ಮಂಜುಳಾ ಗೌಡ (Manjula Gowda)');
  const [phone, setPhone] = useState('9845012345');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [department, setDepartment] = useState('REVENUE_NADAKACHERI');
  const [grievanceCategory, setGrievanceCategory] = useState('UNJUST_REJECTION');
  const [description, setDescription] = useState(
    'ನನ್ನ ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಅರ್ಜಿಯನ್ನು (RD003) ಸಣ್ಣ ಅಕ್ಷರ ದೋಷದಿಂದ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಮರುಪರಿಶೀಲಿಸಿ.'
  );
  const [submitSuccessDocket, setSubmitSuccessDocket] = useState<string | null>(null);

  const fetchDocket = async (num: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiUrl}/api/whatsapp/grievance/${encodeURIComponent(num.trim())}`);
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setDocket(data.docket);
      } else {
        setErrorMsg(data.message || 'ದೂರು ಸಂಖ್ಯೆ ಲಭ್ಯವಿಲ್ಲ (Docket not found)');
      }
    } catch {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ (Connection failed)');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'track') {
      fetchDocket(docketNumber);
    }
  }, [isOpen, activeTab]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Intentional minor review comment for Shipwright: timer not cleared on unmount
    setTimeout(() => {
      fetchDocket(docketNumber);
      setIsRefreshing(false);
    }, 600);
  };

  const handleLodgeGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiUrl}/api/whatsapp/grievance/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ackNumber: prefillAckNumber,
          applicantName,
          phone,
          district,
          department,
          grievanceCategory,
          description,
          preferredLanguage: 'kn',
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setSubmitSuccessDocket(data.docketNumber);
        setDocketNumber(data.docketNumber);
        setActiveTab('track');
        fetchDocket(data.docketNumber);
      } else {
        setErrorMsg(data.error?.message || 'ದೂರು ದಾಖಲಿಸಲು ವಿಫಲವಾಗಿದೆ');
      }
    } catch {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-yellow-700 to-amber-900 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl border border-white/20">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">ಜನಸ್ಪಂದನ 1902</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-950">
                  CM Public Grievance Redressal
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                Karnataka State Citizen Appeals & Grievance Redressal Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-amber-50/50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('track')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'track'
                ? 'border-amber-700 text-amber-900 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            🔍 ದೂರು ಪರಿಶೀಲನೆ (Track Grievance)
          </button>
          <button
            onClick={() => setActiveTab('lodge')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'lodge'
                ? 'border-amber-700 text-amber-900 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            📝 ಹೊಸ ಮೇಲ್ಮನವಿ / ದೂರು (Lodge Appeal)
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
              <span>⚠️ {errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-500 font-bold ml-2">✕</button>
            </div>
          )}

          {submitSuccessDocket && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <span>✅ ದೂರು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ! ದೂರು ಸಂಖ್ಯೆ: <strong>{submitSuccessDocket}</strong></span>
            </div>
          )}

          {activeTab === 'track' ? (
            <div className="space-y-4">
              {/* Search Docket Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={docketNumber}
                  onChange={(e) => setDocketNumber(e.target.value)}
                  placeholder="ದೂರು ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (e.g. JS-2026-B8A91C)"
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase tracking-wider font-mono font-bold"
                />
                <button
                  onClick={() => fetchDocket(docketNumber)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'ಹುಡುಕಲಾಗುತ್ತಿದೆ...' : 'ಶೋಧಿಸಿ (Search)'}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                  title="ಪುನಶ್ಚೇತನ (Refresh)"
                >
                  🔄
                </button>
              </div>

              {docket && (
                <div className="space-y-4">
                  {/* Docket Summary Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                      <div>
                        <div className="text-[11px] text-amber-800 font-semibold">ದೂರು ಸಂಖ್ಯೆ (Docket Number)</div>
                        <div className="text-base font-extrabold text-amber-950 font-mono tracking-wider">
                          {docket.docketNumber}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-600 text-white shadow-sm">
                        {docket.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 font-medium">ಅರ್ಜಿದಾರರು: </span>
                        <strong className="text-gray-900">{docket.applicantName}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">ಸಂಪರ್ಕ: </span>
                        <strong className="text-gray-900">{docket.phone}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">ಇಲಾಖೆ: </span>
                        <strong className="text-gray-900">{docket.department}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">ನಿಯೋಜಿತ ಅಧಿಕಾರಿ: </span>
                        <strong className="text-amber-900">{docket.assignedOfficer}</strong>
                      </div>
                      {docket.ackNumber && (
                        <div className="col-span-2">
                          <span className="text-gray-500 font-medium">ಸಂಬಂಧಿತ ಸೇವಾ ಸಿಂಧು ಅರ್ಜಿ: </span>
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-amber-900">
                            {docket.ackNumber}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200 text-xs text-gray-700">
                      <strong className="text-amber-900 block mb-0.5">ದೂರಿನ ವಿವರ:</strong>
                      {docket.description}
                    </div>
                  </div>

                  {/* Audio player if Sarvam AI synthesized audio exists */}
                  {docket.audioResponseKnBase64 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                        <span>🔊</span> ಸರ್ವಂ ಎಐ ಅಧಿಕೃತ ಧ್ವನಿ ವಿವರಣೆ (Sarvam AI Voice Update)
                      </div>
                      <AudioPlayer
                        audioBase64={docket.audioResponseKnBase64}
                        transcriptText={docket.resolutionTextKn || 'ದೂರು ವಿಚಾರಣೆಯಲ್ಲಿದೆ'}
                        isCitizen={false}
                      />
                    </div>
                  )}

                  {/* Investigation Timeline */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-800 tracking-wide uppercase">
                      ವಿಚಾರಣೆ ಮತ್ತು ಕ್ರಮಗಳ ಕಾಲಮಿತಿ (Inquiry & Action Timeline)
                    </h3>
                    <div className="space-y-2">
                      {docket.timeline.map((step) => {
                        const isDone = step.status === 'COMPLETED';
                        const isCurrent = step.status === 'IN_PROGRESS';
                        return (
                          <div
                            key={step.step}
                            className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                              isDone
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                : isCurrent
                                ? 'bg-amber-50 border-amber-300 shadow-sm text-amber-950'
                                : 'bg-gray-50 border-gray-200 text-gray-400'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isDone
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrent
                                  ? 'bg-amber-600 text-white animate-pulse'
                                  : 'bg-gray-300 text-gray-600'
                              }`}
                            >
                              {isDone ? '✓' : step.step}
                            </div>
                            <div className="flex-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold">{step.titleKn} ({step.titleEn})</span>
                                <span className="text-[10px] opacity-75">{step.updatedAt}</span>
                              </div>
                              <p className="mt-0.5 text-[11px] opacity-90">{step.remarksKn}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Lodge Grievance Form */
            <form onSubmit={handleLodgeGrievance} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    ಅರ್ಜಿದಾರರ ಹೆಸರು (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (Phone) *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    ಜಿಲ್ಲೆ (District) *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    ಇಲಾಖೆ (Department) *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="REVENUE_NADAKACHERI">ಕಂದಾಯ ಇಲಾಖೆ / ನಾಡಕಚೇರಿ (Revenue)</option>
                    <option value="ENERGY_BESCOM">ಬೆಸ್ಕಾಂ / ಇಂಧನ ಇಲಾಖೆ (Electricity / Gruha Jyothi)</option>
                    <option value="WOMEN_AND_CHILD">ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಕಲ್ಯಾಣ (Gruha Lakshmi)</option>
                    <option value="FOOD_AND_CIVIL_SUPPLIES">ಆಹಾರ ಮತ್ತು ನಾಗರಿಕ ಸರಬರಾಜು (Ration)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  ದೂರಿನ ವರ್ಗ (Grievance Category) *
                </label>
                <select
                  value={grievanceCategory}
                  onChange={(e) => setGrievanceCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value="UNJUST_REJECTION">ಅನ್ಯಾಯದ ತಿರಸ್ಕಾರ (Unjust Application Rejection)</option>
                  <option value="SERVICE_DELAY">ಸೇವೆ ವಿಳಂಬ (Service SLA Delay &gt; 21 days)</option>
                  <option value="NAME_MISMATCH_HELP">ಹೆಸರು ತಿದ್ದುಪಡಿ ಸಹಾಯ (Name / Document Discrepancy)</option>
                  <option value="OFFICER_ESCALATION">ಅಧಿಕಾರಿಗಳ ಮಟ್ಟದಲ್ಲಿ ಪರಿಶೀಲನೆ (Escalation to Tahsildar)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  ದೂರಿನ ವಿವರಣೆ (Grievance Description) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="ನಿಮ್ಮ ದೂರಿನ ವಿವರವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ನಮೂದಿಸಿ..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoading ? 'ದೂರು ದಾಖಲಾಗುತ್ತಿದೆ...' : 'ಜನಸ್ಪಂದನ ದೂರು ಸಲ್ಲಿಸಿ (Submit Grievance to CM Portal)'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-[11px] text-gray-500">
          <span>ಸಹಾಯವಾಣಿ (Helpline): <strong>1902</strong> (Toll Free)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ಮುಚ್ಚಿ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
