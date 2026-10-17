import React, { useState, useEffect } from 'react';
import { AudioPlayer } from './AudioPlayer';

interface QRVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillAckNumber?: string;
}

export const QRVerificationModal: React.FC<QRVerificationModalProps> = ({
  isOpen,
  onClose,
  prefillAckNumber = 'RD001',
}) => {
  const [ackNumber, setAckNumber] = useState(prefillAckNumber);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async (ack: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(ack.trim())}`);
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setVerificationData(data);
      } else {
        setErrorMsg(data.message || 'ಅರ್ಜಿ ಸಂಖ್ಯೆ ದೃಢೀಕರಿಸಲಾಗಿಲ್ಲ (Record not found)');
        setVerificationData(null);
      }
    } catch {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ (Connection failed)');
      setVerificationData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAckNumber(prefillAckNumber);
      handleVerify(prefillAckNumber);
    }
  }, [isOpen, prefillAckNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-blue-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl border border-white/20">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">QR & ಡಿಜಿಟಲ್ ದೃಢೀಕರಣ</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-400 text-blue-950">
                  Government Cryptographic Seal
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                Karnataka Seva Sindhu 2.0 • Digital Certificate Authenticity Validator
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

        {/* Input Bar */}
        <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex gap-2">
          <input
            type="text"
            value={ackNumber}
            onChange={(e) => setAckNumber(e.target.value)}
            placeholder="ಅರ್ಜಿ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (e.g. RD001, GJ-...)"
            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold uppercase tracking-wider"
          />
          <button
            onClick={() => handleVerify(ackNumber)}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isLoading ? 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : 'ದೃಢೀಕರಿಸಿ (Verify)'}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
              <span>⚠️ {errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-500 font-bold ml-2">✕</button>
            </div>
          )}

          {verificationData && (
            <div className="space-y-4">
              {/* Badge Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
                  verificationData.verification.verificationBadge === 'DIGITALLY_SIGNED_GENUINE'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : verificationData.verification.verificationBadge === 'ACTION_REQUIRED_FLAGGED'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-blue-50 border-blue-300 text-blue-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {verificationData.verification.verificationBadge === 'DIGITALLY_SIGNED_GENUINE'
                      ? '✅'
                      : verificationData.verification.verificationBadge === 'ACTION_REQUIRED_FLAGGED'
                      ? '⚠️'
                      : '⏳'}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wide">
                      {verificationData.verification.verificationBadge === 'DIGITALLY_SIGNED_GENUINE' &&
                        'ಅಧಿಕೃತ ಡಿಜಿಟಲ್ ದೃಢೀಕೃತ ದಾಖಲೆ (Authentic Verified)'}
                      {verificationData.verification.verificationBadge === 'IN_PROCESS_GENUINE' &&
                        'ಅರ್ಜಿ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ (Valid Application In-Process)'}
                      {verificationData.verification.verificationBadge === 'ACTION_REQUIRED_FLAGGED' &&
                        'ದಾಖಲೆ ಮರು-ಸಲ್ಲಿಕೆ ಅಗತ್ಯವಿದೆ (Action Required)'}
                    </div>
                    <div className="text-[11px] opacity-80">
                      ಅರ್ಜಿ ಸಂಖ್ಯೆ: <strong className="font-mono">{verificationData.verification.ackNumber}</strong>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-white border shadow-xs">
                  GENUINE
                </span>
              </div>

              {/* Spoken Sarvam Audio Confirmation */}
              {verificationData.audioBase64 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span>🔊</span> ಸರ್ವಂ ಎಐ (Sarvam AI) ಧ್ವನಿ ದೃಢೀಕರಣ
                  </div>
                  <AudioPlayer
                    audioBase64={verificationData.audioBase64}
                    transcriptText={verificationData.spokenVerificationKn}
                    isCitizen={false}
                  />
                </div>
              )}

              {/* Certificate Details Grid */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500 block text-[11px]">ಅರ್ಜಿದಾರರು (Applicant):</span>
                    <strong className="text-gray-900">{verificationData.verification.applicantNameMasked}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">ಯೋಜನೆ (Scheme):</span>
                    <strong className="text-gray-900">{verificationData.verification.schemeNameKn}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">ಪ್ರಸ್ತುತ ಹಂತ (Stage):</span>
                    <strong className="text-gray-900">{verificationData.verification.currentStageKn}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">ಪರಿಶೀಲಿಸಿದ ದಿನಾಂಕ:</span>
                    <strong className="text-gray-900">
                      {new Date(verificationData.verification.verifiedAt).toLocaleDateString('en-IN')}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase tracking-wider">
                    ಡಿಜಿಟಲ್ ಸಿಗ್ನೇಚರ್ ಹ್ಯಾಶ್ (SHA-256 Digital Signature):
                  </span>
                  <div className="font-mono text-[10px] bg-white p-2 rounded border border-gray-300 text-gray-700 break-all select-all font-semibold">
                    {verificationData.verification.digitalSignatureSha256}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-[11px] text-gray-500">
          <span>ಸೇವಾ ಸಿಂಧು • ಕರ್ನಾಟಕ ಸರ್ಕಾರ ಡಿಜಿಟಲ್ ದೃಢೀಕರಣ</span>
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
