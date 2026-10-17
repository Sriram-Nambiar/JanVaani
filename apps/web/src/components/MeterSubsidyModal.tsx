import React, { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';

interface MeterSubsidyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MeterSubsidyModal: React.FC<MeterSubsidyModalProps> = ({ isOpen, onClose }) => {
  const [rrNumber, setRrNumber] = useState('BESCOM-W1-4029');
  const [escomName, setEscomName] = useState<'BESCOM' | 'MESCOM' | 'HESCOM' | 'GESCOM' | 'CHESCOM'>('BESCOM');
  const [previousReading, setPreviousReading] = useState(1240);
  const [currentReading, setCurrentReading] = useState(1390);
  const [averageMonthlyUnits, setAverageMonthlyUnits] = useState(160);
  const [phone, setPhone] = useState('9845012345');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/meter/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rrNumber: rrNumber.trim(),
          escomName,
          previousReading: Number(previousReading),
          currentReading: Number(currentReading),
          averageMonthlyUnits: Number(averageMonthlyUnits),
          consumerPhone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setResult(data);
      } else {
        setErrorMsg(data.error?.message || 'ಮೀಟರ್ ಲೆಕ್ಕಾಚಾರ ವಿಫಲವಾಗಿದೆ (Calculation failed)');
        setResult(null);
      }
    } catch {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ (Connection failed)');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemo = (rr: string, prev: number, curr: number, escom: any, avg: number) => {
    setRrNumber(rr);
    setPreviousReading(prev);
    setCurrentReading(curr);
    setEscomName(escom);
    setAverageMonthlyUnits(avg);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                ಗೃಹ ಜ್ಯೋತಿ 200 ಯೂನಿಟ್ ಮೀಟರ್ ಲೆಕ್ಕಾಚಾರ
              </h2>
              <p className="text-xs text-amber-100">
                Gruha Jyothi Zero-Bill & Power Subsidy Calculator
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
              ಡೆಮೊ ಮೀಟರ್ ಆಯ್ಕೆ (Quick Presets):
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadDemo('BESCOM-W1-4029', 1240, 1390, 'BESCOM', 160)}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold hover:bg-emerald-100 transition-colors"
              >
                🌱 BESCOM ₹0 ಶೂನ್ಯ ಬಿಲ್ (150 ಯೂನಿಟ್)
              </button>
              <button
                type="button"
                onClick={() => loadDemo('HESCOM-HD-8102', 2100, 2320, 'HESCOM', 180)}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 font-semibold hover:bg-amber-100 transition-colors"
              >
                ⚠️ HESCOM ಹೆಚ್ಚುವರಿ ಬಳಕೆ (220 ಯೂನಿಟ್)
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ವಿದ್ಯುತ್ ನಿಗಮ (ESCOM):
                </label>
                <select
                  value={escomName}
                  onChange={(e) => setEscomName(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-medium focus:ring-2 focus:ring-amber-500"
                >
                  <option value="BESCOM">BESCOM (ಬೆಂಗಳೂರು)</option>
                  <option value="MESCOM">MESCOM (ಮಂಗಳೂರು)</option>
                  <option value="HESCOM">HESCOM (ಹುಬ್ಬಳ್ಳಿ)</option>
                  <option value="GESCOM">GESCOM (ಕಲಬುರಗಿ)</option>
                  <option value="CHESCOM">CHESCOM (ಮೈಸೂರು)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ಆರ್.ಆರ್. ಸಂಖ್ಯೆ (RR Number):
                </label>
                <input
                  type="text"
                  value={rrNumber}
                  onChange={(e) => setRrNumber(e.target.value)}
                  placeholder="e.g. BESCOM-W1-4029"
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ಹಿಂದಿನ ರೀಡಿಂಗ್:
                </label>
                <input
                  type="number"
                  value={previousReading}
                  onChange={(e) => setPreviousReading(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ಪ್ರಸ್ತುತ ರೀಡಿಂಗ್:
                </label>
                <input
                  type="number"
                  value={currentReading}
                  onChange={(e) => setCurrentReading(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ಸರಾಸರಿ ಬಳಕೆ:
                </label>
                <input
                  type="number"
                  value={averageMonthlyUnits}
                  onChange={(e) => setAverageMonthlyUnits(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold"
                  title="Average monthly consumption for subsidy limit quota"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (Citizen Phone):
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9845012345"
                className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'ಲೆಕ್ಕಾಚಾರ ನಡೆಯುತ್ತಿದೆ...' : '⚡ ಸಬ್ಸಿಡಿ & ಬಿಲ್ ಲೆಕ್ಕ ಹಾಕಿ (Calculate Subsidy)'}
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {result && (
            <div className="space-y-4 pt-2 border-t border-gray-200 animate-in fade-in">
              {/* Subsidy Verdict Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  result.meter.isZeroBillEligible
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {result.meter.isZeroBillEligible ? '🎉' : '⚡'}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wide">
                      {result.meter.isZeroBillEligible
                        ? '₹0 ಶೂನ್ಯ ಬಿಲ್ ಅರ್ಹತೆ (Zero Bill Active)'
                        : `ಹೆಚ್ಚುವರಿ ಪಾವತಿ ಮೊತ್ತ: ₹${result.meter.netPayableAmount}`}
                    </div>
                    <div className="text-[11px] opacity-80">
                      ಬಳಕೆ: <strong>{result.meter.consumedUnits} ಯೂನಿಟ್</strong> • ಉಚಿತ ಕೋಟಾ:{' '}
                      <strong>{result.meter.entitlementLimitUnits} ಯೂನಿಟ್</strong>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] block opacity-70">ಸರ್ಕಾರದ ಸಬ್ಸಿಡಿ:</span>
                  <strong className="text-sm font-extrabold text-emerald-700">
                    ₹{result.meter.subsidyAmountSaved} ಉಳಿತಾಯ
                  </strong>
                </div>
              </div>

              {/* Spoken Voice Explanation */}
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

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-[11px] text-gray-500">
          <span>ಕರ್ನಾಟಕ ಇಂಧನ ಇಲಾಖೆ • ಗೃಹ ಜ್ಯೋತಿ 200 ಯೂನಿಟ್ ಯೋಜನೆ</span>
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
