import React, { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';

interface AnnaBhagyaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EntitlementData {
  status: string;
  entitlement: {
    cardType: string;
    headOfFamilyMasked: string;
    memberCount: number;
    isEligible: boolean;
    freeRiceKg: number;
    dbtCashPerMonth: number;
    ratePerKg: number;
    dbtStatus: string;
    dbtStatusKn: string;
    district: string;
    rationCardNumber: string;
  };
  spokenExplanationKn: string;
  spokenExplanationEn: string;
  audioBase64?: string;
}

export const AnnaBhagyaModal: React.FC<AnnaBhagyaModalProps> = ({ isOpen, onClose }) => {
  const [rationCardNumber, setRationCardNumber] = useState('RC-KAR-BPL-8821');
  const [headOfFamilyName, setHeadOfFamilyName] = useState('ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)');
  const [cardType, setCardType] = useState<'BPL' | 'AAY' | 'APL'>('BPL');
  const [memberCount, setMemberCount] = useState<number>(4);
  const [dbtBankLinked, setDbtBankLinked] = useState<boolean>(true);
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EntitlementData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/annabhagya/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rationCardNumber: rationCardNumber.trim(),
          headOfFamilyName: headOfFamilyName.trim(),
          cardType,
          memberCount: Number(memberCount),
          dbtBankLinked,
          district: district.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setResult(data);
      } else {
        setErrorMsg(data.error?.message || 'ಅರ್ಹತೆ ಲೆಕ್ಕಾಚಾರ ವಿಫಲವಾಗಿದೆ (Calculation failed)');
        setResult(null);
      }
    } catch {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ (Connection failed)');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              🌾
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                ಅನ್ನಭಾಗ್ಯ ಯೋಜನೆ (Anna Bhagya Scheme)
              </h2>
              <p className="text-xs text-emerald-100">
                10kg Free Rice & Monthly Cash DBT Calculator (Guarantee #3)
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

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ಪಡಿತರ ಚೀಟಿ ಸಂಖ್ಯೆ (Ration Card No):
                </label>
                <input
                  type="text"
                  value={rationCardNumber}
                  onChange={(e) => setRationCardNumber(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold"
                  placeholder="RC-KAR-BPL-8821"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ಕುಟುಂಬದ ಮುಖ್ಯಸ್ಥರ ಹೆಸರು (Head of Family):
                </label>
                <input
                  type="text"
                  value={headOfFamilyName}
                  onChange={(e) => setHeadOfFamilyName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-semibold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ಕಾರ್ಡ್ ವರ್ಗ (Card Type):
                </label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-medium"
                >
                  <option value="BPL">BPL (ಆದ್ಯತಾ ಕುಟುಂಬ - PHH)</option>
                  <option value="AAY">AAY (ಅಂತ್ಯೋದಯ - Antyodaya)</option>
                  <option value="APL">APL (ಸಾಮಾನ್ಯ - Non-Priority)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ಕುಟುಂಬದ ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members):
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={memberCount}
                  onChange={(e) => setMemberCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={dbtBankLinked}
                    onChange={(e) => setDbtBankLinked(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <span>ಆಧಾರ್ ಬ್ಯಾಂಕ್ ಡಿಬಿಟಿ ಜೋಡಣೆ (NPCI Linked)</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
              🌾 ಕರ್ನಾಟಕ ಅನ್ನಭಾಗ್ಯ: ಪ್ರತಿ ಸದಸ್ಯರಿಗೆ 5 ಕೆಜಿ ಉಚಿತ ಅಕ್ಕಿ + ಹೆಚ್ಚುವರಿ 5 ಕೆಜಿ ಅಕ್ಕಿಗೆ ₹34 ರಂತೆ ತಿಂಗಳಿಗೆ ₹170 ನೇರ ನಗದು ವರ್ಗಾವಣೆ (DBT).
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'ಲೆಕ್ಕಾಚಾರ ಮಾಡಲಾಗುತ್ತಿದೆ...' : '🌾 ಅನ್ನಭಾಗ್ಯ ಸೌಲಭ್ಯ ಲೆಕ್ಕಾಚಾರ (Calculate Entitlement)'}
            </button>
          </form>

          {/* Result Section */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-gray-200 animate-in fade-in">
              <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 text-white p-4 rounded-2xl shadow-lg border-2 border-emerald-300">
                <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌾</span>
                    <span className="font-extrabold text-xs tracking-wider uppercase">
                      ಅನ್ನಭಾಗ್ಯ ಮಾಸಿಕ ಸೌಲಭ್ಯ ಪತ್ರ
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono font-bold">
                    {result.entitlement.cardType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-emerald-100 block text-[10px]">ಮುಖ್ಯಸ್ಥರು (Head of Family):</span>
                    <strong className="font-bold text-white">{result.entitlement.headOfFamilyMasked}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-100 block text-[10px]">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members):</span>
                    <strong className="font-mono text-white font-bold">{result.entitlement.memberCount} ಜನರು</strong>
                  </div>
                  <div>
                    <span className="text-emerald-100 block text-[10px]">ಉಚಿತ ಅಕ್ಕಿ (Free Rice):</span>
                    <strong className="text-yellow-200 font-extrabold text-sm">
                      {result.entitlement.freeRiceKg} ಕೆಜಿ / ತಿಂಗಳು
                    </strong>
                  </div>
                  <div>
                    <span className="text-emerald-100 block text-[10px]">ನೇರ ನಗದು DBT (Monthly Cash):</span>
                    <strong className="text-yellow-200 font-extrabold text-sm">
                      ₹{result.entitlement.dbtCashPerMonth} / ತಿಂಗಳು
                    </strong>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/20 text-[11px] font-semibold flex items-center justify-between">
                  <span>ಸ್ಥಿತಿ: {result.entitlement.dbtStatusKn}</span>
                  <span className="text-emerald-100">{result.entitlement.district}</span>
                </div>
              </div>

              {/* Spoken Voice Confirmation */}
              {result.audioBase64 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span>🔊</span> ಸರ್ವಂ ಎಐ (Sarvam AI) ಧ್ವನಿ ವಿವರಣೆ
                  </div>
                  <AudioPlayer
                    audioBase64={result.audioBase64}
                    transcriptText={result.spokenExplanationKn}
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
