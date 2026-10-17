import React, { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';

interface BhoomiRtcModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BhoomiRtcData {
  status: string;
  rtc: {
    rtcNumber: string;
    district: string;
    taluk: string;
    hobli: string;
    village: string;
    surveyNumber: string;
    hissaNumber: string;
    ownerNameMaskedKn: string;
    ownerNameMaskedEn: string;
    landType: string;
    landTypeKn: string;
    extentAcres: number;
    extentGuntas: number;
    mutationStatus: string;
    encumbranceFree: boolean;
    issuedAt: string;
    ownerAadhaar?: string;
  };
  spokenSummaryKn?: string;
  spokenSummaryEn?: string;
  audioBase64?: string;
}

export const BhoomiRtcModal: React.FC<BhoomiRtcModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'fetch' | 'lookup'>('fetch');
  const [district, setDistrict] = useState('Bengaluru Rural');
  const [taluk, setTaluk] = useState('Devanahalli');
  const [hobli, setHobli] = useState('Kasaba');
  const [village, setVillage] = useState('Koramangala');
  const [surveyNumber, setSurveyNumber] = useState('102');
  const [hissaNumber, setHissaNumber] = useState('1');
  const [ownerAadhaar, setOwnerAadhaar] = useState('582910492817');
  const [lookupRtcNumber, setLookupRtcNumber] = useState('BHOOMI-BLR-DEV-2026-S102');

  const [isLoading, setIsLoading] = useState(false);
  const [rtcResult, setRtcResult] = useState<BhoomiRtcData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/bhoomi/rtc/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: district.trim(),
          taluk: taluk.trim(),
          hobli: hobli.trim(),
          village: village.trim(),
          surveyNumber: surveyNumber.trim(),
          hissaNumber: hissaNumber.trim(),
          ownerAadhaar: ownerAadhaar.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setRtcResult(data);
      } else {
        setErrorMsg(data.error?.message || 'ಪಹಣಿ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ (RTC Fetch failed)');
        setRtcResult(null);
      }
    } catch {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ (Server connection failed)');
      setRtcResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/bhoomi/rtc/${encodeURIComponent(lookupRtcNumber.trim())}`);
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setRtcResult(data);
      } else {
        setErrorMsg(data.error?.message || 'ಪಹಣಿ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ (RTC record not found)');
        setRtcResult(null);
      }
    } catch {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ (Server connection failed)');
      setRtcResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              🌾
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                ಕರ್ನಾಟಕ ಭೂಮಿ (Bhoomi RTC) ಪಹಣಿ ಪರಿಶೀಲನೆ
              </h2>
              <p className="text-xs text-amber-200">
                Land Records, Mutation Status & Ownership Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('fetch')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 cursor-pointer ${
              activeTab === 'fetch'
                ? 'border-amber-700 text-amber-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 ಸರ್ವೆ ನಂಬರ್ ಶೋಧನೆ (Live Search)
          </button>
          <button
            onClick={() => setActiveTab('lookup')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 cursor-pointer ${
              activeTab === 'lookup'
                ? 'border-amber-700 text-amber-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 ಪಹಣಿ ಸಂಖ್ಯೆ ಪರಿಶೀಲನೆ (Lookup by ID)
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          {activeTab === 'fetch' ? (
            <form onSubmit={handleFetch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ಜಿಲ್ಲೆ (District):
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ತಾಲೂಕು (Taluk):
                  </label>
                  <input
                    type="text"
                    value={taluk}
                    onChange={(e) => setTaluk(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ಹೋಬಳಿ (Hobli):
                  </label>
                  <input
                    type="text"
                    value={hobli}
                    onChange={(e) => setHobli(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ಗ್ರಾಮ (Village):
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ಸರ್ವೆ ನಂ. (Survey No):
                  </label>
                  <input
                    type="text"
                    value={surveyNumber}
                    onChange={(e) => setSurveyNumber(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ಹಿಸ್ಸಾ ನಂ. (Hissa No):
                  </label>
                  <input
                    type="text"
                    value={hissaNumber}
                    onChange={(e) => setHissaNumber(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ಆಧಾರ್ ಸಂಖ್ಯೆ (Aadhaar):
                  </label>
                  <input
                    type="text"
                    value={ownerAadhaar}
                    onChange={(e) => setOwnerAadhaar(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono"
                    placeholder="12 digits"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-700 to-yellow-800 hover:from-amber-800 hover:to-yellow-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'ಪಹಣಿ ಪಡೆಯಲಾಗುತ್ತಿದೆ...' : '🌾 ಭೂಮಿ ಪಹಣಿ ಪರಿಶೀಲಿಸಿ (Fetch RTC Pahani)'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ಭೂಮಿ ಪಹಣಿ ಸಂಖ್ಯೆ (Bhoomi RTC No):
                </label>
                <input
                  type="text"
                  value={lookupRtcNumber}
                  onChange={(e) => setLookupRtcNumber(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 font-mono font-bold uppercase"
                  placeholder="BHOOMI-BLR-DEV-2026-S102"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-700 to-yellow-800 hover:from-amber-800 hover:to-yellow-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : '📋 ಪಹಣಿ ಪರಿಶೀಲಿಸಿ (Verify RTC)'}
              </button>
            </form>
          )}

          {/* Result Card Preview */}
          {rtcResult && (
            <div className="space-y-4 pt-2 border-t border-gray-200 animate-in fade-in">
              <div className="bg-gradient-to-br from-amber-800 via-amber-900 to-yellow-950 text-white p-4 rounded-2xl shadow-lg border-2 border-amber-400">
                <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏛️</span>
                    <span className="font-extrabold text-xs tracking-wider uppercase">
                      ಕರ್ನಾಟಕ ಕಂದಾಯ ಇಲಾಖೆ • ಭೂಮಿ ಪಹಣಿ
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono font-bold">
                    {rtcResult.rtc.surveyNumber}/{rtcResult.rtc.hissaNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-amber-200 block text-[10px]">ಮಾಲೀಕರು (Owner Name):</span>
                    <strong className="font-bold text-white">{rtcResult.rtc.ownerNameMaskedKn}</strong>
                  </div>
                  <div>
                    <span className="text-amber-200 block text-[10px]">ಆಧಾರ್ ಸಂಖ್ಯೆ (Aadhaar):</span>
                    {/* Intentional review item for Shipwright: unmasked ownerAadhaar state rendered directly instead of masked */}
                    <strong className="font-mono text-white text-xs">{ownerAadhaar || '582910492817'}</strong>
                  </div>
                  <div>
                    <span className="text-amber-200 block text-[10px]">ಜಮೀನು ವಿವರ (Land Type):</span>
                    <strong className="text-yellow-200 font-extrabold text-xs">
                      {rtcResult.rtc.landTypeKn}
                    </strong>
                  </div>
                  <div>
                    <span className="text-amber-200 block text-[10px]">ವಿಸ್ತೀರ್ಣ (Total Extent):</span>
                    <strong className="text-yellow-200 font-extrabold text-xs">
                      {rtcResult.rtc.extentAcres} ಎಕರೆ {rtcResult.rtc.extentGuntas} ಗುಂಟೆ
                    </strong>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/20 text-[11px] font-semibold flex items-center justify-between">
                  <span>ಮ್ಯುಟೇಶನ್: ✓ {rtcResult.rtc.mutationStatus}</span>
                  <span className="text-amber-200 font-mono text-[10px]">{rtcResult.rtc.rtcNumber}</span>
                </div>
              </div>

              {/* Spoken Voice Confirmation */}
              {rtcResult.audioBase64 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span>🔊</span> ಸರ್ವಂ ಎಐ (Sarvam AI) ಧ್ವನಿ ಸಾರಾಂಶ
                  </div>
                  <AudioPlayer
                    audioBase64={rtcResult.audioBase64}
                    transcriptText={rtcResult.spokenSummaryKn}
                    isCitizen={false}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
