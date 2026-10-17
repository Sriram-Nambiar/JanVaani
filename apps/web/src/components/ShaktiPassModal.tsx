import React, { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';

interface ShaktiPassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShaktiPassModal: React.FC<ShaktiPassModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pass' | 'route'>('pass');

  // Pass Form State
  const [applicantName, setApplicantName] = useState('ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)');
  const [aadhaarNumber, setAadhaarNumber] = useState('582910494821');
  const [preferredRtc, setPreferredRtc] = useState<'KSRTC' | 'BMTC' | 'NWKRTC' | 'KKRTC'>('BMTC');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [passResult, setPassResult] = useState<any>(null);

  // Route Form State
  const [routeRtc, setRouteRtc] = useState<'KSRTC' | 'BMTC' | 'NWKRTC' | 'KKRTC'>('KSRTC');
  const [busCategory, setBusCategory] = useState<
    'ORDINARY' | 'EXPRESS' | 'NAGARA_SARIGE' | 'RAJAHAMSA' | 'AIRAVAT' | 'EV_AC'
  >('EXPRESS');
  const [origin, setOrigin] = useState('ಬೆಂಗಳೂರು (Bengaluru)');
  const [destination, setDestination] = useState('ಮೈಸೂರು (Mysuru)');
  const [routeResult, setRouteResult] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/shakti/pass/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: applicantName.trim(),
          gender: 'FEMALE',
          isKarnatakaDomicile: true,
          aadhaarNumber: aadhaarNumber.trim(),
          preferredRtc,
          district: district.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setPassResult(data);
      } else {
        setErrorMsg(data.error?.message || 'ಪಾಸ್ ನೀಡಿಕೆ ವಿಫಲವಾಗಿದೆ (Failed to issue pass)');
        setPassResult(null);
      }
    } catch {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ (Connection failed)');
      setPassResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/shakti/route/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rtc: routeRtc,
          busCategory,
          origin: origin.trim(),
          destination: destination.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setRouteResult(data);
      } else {
        setErrorMsg(data.error?.message || 'ಮಾರ್ಗ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ (Route check failed)');
        setRouteResult(null);
      }
    } catch {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ (Connection failed)');
      setRouteResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              🌸
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                ಶಕ್ತಿ ಯೋಜನೆ (Shakti Scheme) ಸ್ಮಾರ್ಟ್ ಪಾಸ್
              </h2>
              <p className="text-xs text-pink-100">
                100% Free Bus Travel for Karnataka Women (KSRTC • BMTC)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => {
              setActiveTab('pass');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'pass'
                ? 'bg-white text-pink-700 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            🎫 ಶಕ್ತಿ ಸ್ಮಾರ್ಟ್ ಪಾಸ್ (Smart Pass)
          </button>
          <button
            onClick={() => {
              setActiveTab('route');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'route'
                ? 'bg-white text-pink-700 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            🚌 ಬಸ್ ಮಾರ್ಗ ಪರಿಶೀಲನೆ (Route Checker)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {activeTab === 'pass' ? (
            <div className="space-y-4">
              <form onSubmit={handleApplyPass} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ಮಹಿಳಾ ಅರ್ಜಿದಾರರ ಹೆಸರು:
                    </label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ಆಧಾರ್ ಸಂಖ್ಯೆ (Aadhaar):
                    </label>
                    <input
                      type="text"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ಸಾರಿಗೆ ನಿಗಮ (RTC):
                    </label>
                    <select
                      value={preferredRtc}
                      onChange={(e) => setPreferredRtc(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-medium"
                    >
                      <option value="BMTC">BMTC (ಬೆಂಗಳೂರು)</option>
                      <option value="KSRTC">KSRTC (ಕರ್ನಾಟಕ ಸಾರಿಗೆ)</option>
                      <option value="NWKRTC">NWKRTC (ವಾಯವ್ಯ ಕರ್ನಾಟಕ)</option>
                      <option value="KKRTC">KKRTC (ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ಜಿಲ್ಲೆ (District):
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-900 font-medium">
                  ✓ ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಶಕ್ತಿ ಯೋಜನೆಯಡಿ ರಾಜ್ಯದ ಎಲ್ಲಾ ಮಹಿಳೆಯರಿಗೆ ಸಾಮಾನ್ಯ ಮತ್ತು ವೇಗದೂತ ಬಸ್‌ಗಳಲ್ಲಿ 100% ಉಚಿತ ಪ್ರಯಾಣ.
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'ಪಾಸ್ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...' : '🌸 ಶಕ್ತಿ ಸ್ಮಾರ್ಟ್ ಪಾಸ್ ಪಡೆಯಿರಿ (Issue Smart Pass)'}
                </button>
              </form>

              {passResult && (
                <div className="space-y-4 pt-2 border-t border-gray-200 animate-in fade-in">
                  {/* Digital Shakti Card Preview */}
                  <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 text-white p-4 rounded-2xl shadow-lg border-2 border-pink-300">
                    <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌸</span>
                        <span className="font-extrabold text-xs tracking-wider uppercase">
                          ಕರ್ನಾಟಕ ಸರ್ಕಾರ • ಶಕ್ತಿ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್
                        </span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono font-bold">
                        {passResult.pass.preferredRtc}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-pink-100 block text-[10px]">ಅರ್ಜಿದಾರರು (Applicant):</span>
                        <strong className="font-bold text-white">{passResult.pass.applicantNameMasked}</strong>
                      </div>
                      <div>
                        <span className="text-pink-100 block text-[10px]">ಪಾಸ್ ಸಂಖ್ಯೆ (Pass No):</span>
                        <strong className="font-mono text-white font-bold">{passResult.pass.passNumber}</strong>
                      </div>
                      <div>
                        <span className="text-pink-100 block text-[10px]">ಪ್ರಯಾಣ ದರ (Fare):</span>
                        <strong className="text-yellow-200 font-extrabold">₹0 ಸಂಪೂರ್ಣ ಉಚಿತ</strong>
                      </div>
                      <div>
                        <span className="text-pink-100 block text-[10px]">ಮಾನ್ಯತೆ (Validity):</span>
                        <strong className="text-white text-[11px]">
                          {new Date(passResult.pass.validThrough).toLocaleDateString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Spoken Voice Confirmation */}
                  {passResult.audioBase64 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span>🔊</span> ಸರ್ವಂ ಎಐ (Sarvam AI) ಧ್ವನಿ ದೃಢೀಕರಣ
                      </div>
                      <AudioPlayer
                        audioBase64={passResult.audioBase64}
                        transcriptText={passResult.spokenConfirmationKn}
                        isCitizen={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleCheckRoute} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ಸಾರಿಗೆ ನಿಗಮ (RTC):
                    </label>
                    <select
                      value={routeRtc}
                      onChange={(e) => setRouteRtc(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-medium"
                    >
                      <option value="KSRTC">KSRTC (ಕರ್ನಾಟಕ ಸಾರಿಗೆ)</option>
                      <option value="BMTC">BMTC (ಬೆಂಗಳೂರು ಮಹಾನಗರ)</option>
                      <option value="NWKRTC">NWKRTC (ವಾಯವ್ಯ)</option>
                      <option value="KKRTC">KKRTC (ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ಬಸ್ ಮಾದರಿ (Bus Category):
                    </label>
                    <select
                      value={busCategory}
                      onChange={(e) => setBusCategory(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-medium"
                    >
                      <option value="ORDINARY">ಸಾಮಾನ್ಯ ಬಸ್ (Ordinary - Free)</option>
                      <option value="EXPRESS">ಕರ್ನಾಟಕ ಸಾರಿಗೆ ವೇಗದೂತ (Express - Free)</option>
                      <option value="NAGARA_SARIGE">ನಗರ ಸಾರಿಗೆ (City Bus - Free)</option>
                      <option value="RAJAHAMSA">ರಾಜಹಂಸ (Rajahamsa - Paid)</option>
                      <option value="AIRAVAT">ಐರಾವತ ಕ್ಲಬ್ ಕ್ಲಾಸ್ (Airavat - Paid)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ಹೊರಡುವ ಸ್ಥಳ (Origin):
                    </label>
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ತಲುಪುವ ಸ್ಥಳ (Destination):
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 font-semibold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತಿದೆ...' : '🚌 ಉಚಿತ ಟಿಕೆಟ್ ಪರಿಶೀಲಿಸಿ (Check Free Ticket)'}
                </button>
              </form>

              {routeResult && (
                <div className="space-y-4 pt-2 border-t border-gray-200 animate-in fade-in">
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      routeResult.routeCheck.isZeroTicketEligible
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">
                        {routeResult.routeCheck.isZeroTicketEligible ? '🎫' : '⚠️'}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold uppercase tracking-wide">
                          {routeResult.routeCheck.isZeroTicketEligible
                            ? '₹0 ಶೂನ್ಯ ಶುಲ್ಕ ಟಿಕೆಟ್ (100% Free Travel Active)'
                            : `ಶಕ್ತಿ ಯೋಜನೆಯಡಿ ಒಳಪಡುವುದಿಲ್ಲ (ದರ: ₹${routeResult.routeCheck.payableFare})`}
                        </div>
                        <div className="text-[11px] opacity-80">
                          {routeResult.routeCheck.origin} ➔ {routeResult.routeCheck.destination} (
                          {routeResult.routeCheck.rtc})
                        </div>
                      </div>
                    </div>
                    {routeResult.routeCheck.isZeroTicketEligible && (
                      <div className="text-right">
                        <span className="text-[10px] block opacity-70">ಉಳಿತಾಯ:</span>
                        <strong className="text-sm font-extrabold text-emerald-700">
                          ₹{routeResult.routeCheck.subsidySavings}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Audio Player */}
                  {routeResult.audioBase64 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span>🔊</span> ಸರ್ವಂ ಎಐ (Sarvam AI) ಮಾರ್ಗ ವಿವರಣೆ
                      </div>
                      <AudioPlayer
                        audioBase64={routeResult.audioBase64}
                        transcriptText={routeResult.spokenExplanationKn}
                        isCitizen={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-[11px] text-gray-500">
          <span>ಕರ್ನಾಟಕ ಸಾರಿಗೆ ಇಲಾಖೆ • ಶಕ್ತಿ ಯೋಜನೆ (Shakti Guarantee)</span>
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
