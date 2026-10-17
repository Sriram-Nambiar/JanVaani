import React, { useState, useEffect } from 'react';
import { AudioPlayer } from './AudioPlayer';

interface GramaOneKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GramaOneKioskModal: React.FC<GramaOneKioskModalProps> = ({ isOpen, onClose }) => {
  const [citizenName, setCitizenName] = useState('ಶಿವಣ್ಣ (Shivanna)');
  const [phone, setPhone] = useState('9845012345');
  const [serviceType, setServiceType] = useState('GRUHA_JYOTHI');
  const [issuedToken, setIssuedToken] = useState<any>(null);
  const [calledToken, setCalledToken] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/kiosk/queue/status');
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setQueueStatus(data.queue);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen]);

  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/kiosk/token/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenName,
          phone,
          serviceType,
          village: 'ನೆಲಮಂಗಲ (Nelamangala)',
          counterNumber: 1,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setIssuedToken(data);
        fetchQueue();
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallNext = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/kiosk/queue/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterNumber: 1 }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setCalledToken(data.calledToken);
        fetchQueue();
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-emerald-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl border border-white/20">
              🏪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">ಗ್ರಾಮ ಒನ್ (Grama One Kiosk)</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950">
                  Rural Citizen Service Kiosk
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Government of Karnataka • Village Level Citizen Assistance & Queue Engine
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

        {/* Queue Metrics Bar */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-xs font-semibold text-emerald-900">
          <div className="flex items-center gap-4">
            <span>ಕಿಯೋಸ್ಕ್: <strong>ನೆಲಮಂಗಲ ಗ್ರಾಮೀಣ ಕೇಂದ್ರ</strong></span>
            <span>ಕಾಯುತ್ತಿರುವವರು: <strong>{queueStatus?.waitingCount ?? 1} ಜನ</strong></span>
          </div>
          <button
            onClick={handleCallNext}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            📢 ಮುಂದಿನ ಟೋಕನ್ ಕರೆಯಿರಿ (Call Next)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Audio announcement if called */}
          {calledToken?.audioAnnouncementBase64 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-extrabold text-amber-950 mb-1 flex items-center gap-2">
                <span>🔊</span> ಕೌಂಟರ್ ಧ್ವನಿ ಪ್ರಕಟಣೆ (Spoken Kannada Call)
              </div>
              <AudioPlayer
                audioBase64={calledToken.audioAnnouncementBase64}
                transcriptText={calledToken.announcementScriptKn}
                isCitizen={false}
              />
            </div>
          )}

          {/* Issued Ticket Display */}
          {issuedToken && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-2xl p-5 text-center shadow-md space-y-2">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                ಗ್ರಾಮ ಒನ್ ಅಧಿಕೃತ ಟೋಕನ್ ಚೀಟಿ (Official Kiosk Ticket)
              </div>
              <div className="text-4xl font-extrabold text-emerald-950 font-mono tracking-wider">
                #{issuedToken.tokenNumber}
              </div>
              <div className="text-xs text-gray-700 font-medium">
                ಅರ್ಜಿದಾರರು: <strong>{issuedToken.citizenNameMasked}</strong> • ಸೇವೆ: <strong>{issuedToken.serviceTitleKn}</strong>
              </div>
              {issuedToken.audioAnnouncementBase64 && (
                <div className="pt-2 max-w-md mx-auto">
                  <AudioPlayer
                    audioBase64={issuedToken.audioAnnouncementBase64}
                    transcriptText={issuedToken.announcementScriptKn}
                    isCitizen={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* Issue Token Form */}
          <form onSubmit={handleIssueToken} className="space-y-4 bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              ಹೊಸ ಟೋಕನ್ ನೀಡಿಕೆ (Issue Kiosk Queue Token)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  ನಾಗರಿಕರ ಹೆಸರು (Citizen Name) *
                </label>
                <input
                  type="text"
                  required
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                ಅಗತ್ಯವಿರುವ ಸರ್ಕಾರಿ ಸೇವೆ (Requested Service) *
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                <option value="GRUHA_JYOTHI">⚡ ಗೃಹಜ್ಯೋತಿ ಯೋಜನೆ (200 Units Free Electricity)</option>
                <option value="GRUHA_LAKSHMI">💰 ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ (₹2,000/mo DBT Assistance)</option>
                <option value="CASTE_INCOME">📜 ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ (Caste & Income)</option>
                <option value="JANASPANDANA_GRIEVANCE">🏛️ ಜನಸ್ಪಂದನ ಸಾರ್ವಜನಿಕ ದೂರು (1902 Grievance)</option>
                <option value="DOCUMENT_VERIFICATION">🔍 ಕಾಗದ-ತಪಾಸಣೆ ದಾಖಲೆ ಪರಿಶೀಲನೆ (Document Audit)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'ಟೋಕನ್ ನೀಡಲಾಗುತ್ತಿದೆ...' : 'ಟೋಕನ್ ಮುದ್ರಿಸಿ & ಧ್ವನಿ ಪ್ರಕಟಣೆ (Print Token & Announce)'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-[11px] text-gray-500">
          <span>ಕರ್ನಾಟಕ ಗ್ರಾಮ ಒನ್ • ಕಿಯೋಸ್ಕ್ ಕೌಂಟರ್: <strong>ಕೌಂಟರ್ 1</strong></span>
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
