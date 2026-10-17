import React, { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';

interface YuvaNidhiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const YuvaNidhiModal: React.FC<YuvaNidhiModalProps> = ({ isOpen, onClose }) => {
  const [educationRegNo, setEducationRegNo] = useState('ENG-2024-8491');
  const [applicantName, setApplicantName] = useState('ಚೇತನ್ ಕುಮಾರ್ (Chetan Kumar)');
  const [qualification, setQualification] = useState<'GRADUATE' | 'DIPLOMA' | 'POST_GRADUATE'>('GRADUATE');
  const [passingYear, setPassingYear] = useState(2024);
  const [monthsUnemployed, setMonthsUnemployed] = useState(8);
  const [isEmployed, setIsEmployed] = useState(false);
  const [isPursuingHigherStudies, setIsPursuingHigherStudies] = useState(false);
  const [isKarnatakaDomicile, setIsKarnatakaDomicile] = useState(true);
  const [rationCardNumber, setRationCardNumber] = useState('KA-04-9841284');

  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/yuva-nidhi/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          educationRegNo: educationRegNo.trim(),
          applicantName: applicantName.trim(),
          qualification,
          passingYear: Number(passingYear),
          monthsUnemployed: Number(monthsUnemployed),
          isEmployed,
          isPursuingHigherStudies,
          isKarnatakaDomicile,
          rationCardNumber: rationCardNumber.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setResult(data);
      } else {
        setErrorMsg(data.error?.message || 'ಅರ್ಹತಾ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ (Verification failed)');
        setResult(null);
      }
    } catch {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ (Connection failed)');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (
    reg: string,
    name: string,
    qual: any,
    year: number,
    unemployedMonths: number,
    ration: string
  ) => {
    setEducationRegNo(reg);
    setApplicantName(name);
    setQualification(qual);
    setPassingYear(year);
    setMonthsUnemployed(unemployedMonths);
    setIsEmployed(false);
    setIsPursuingHigherStudies(false);
    setIsKarnatakaDomicile(true);
    setRationCardNumber(ration);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              🎓
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                ಯುವನಿಧಿ ನಿರುದ್ಯೋಗ ಭತ್ಯೆ ಅರ್ಹತಾ ಪರಿಶೀಲನೆ
              </h2>
              <p className="text-xs text-blue-100">
                Karnataka Yuva Nidhi DBT Allowance Eligibility Engine
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
          {/* Presets */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
              ಡೆಮೊ ಅಭ್ಯರ್ಥಿ ಆಯ್ಕೆ (Quick Presets):
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  loadPreset('ENG-2024-8491', 'ಚೇತನ್ ಕುಮಾರ್ (Chetan Kumar)', 'GRADUATE', 2024, 8, 'KA-04-9841284')
                }
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-300 font-semibold hover:bg-blue-100 transition-colors"
              >
                🎓 ಪದವೀಧರರು (Graduate ₹3,000/ತಿಂಗಳು)
              </button>
              <button
                type="button"
                onClick={() =>
                  loadPreset('DIP-2025-1042', 'ರಮ್ಯಾ ಎಸ್ (Ramya S)', 'DIPLOMA', 2025, 7, 'KA-12-3841029')
                }
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-300 font-semibold hover:bg-purple-100 transition-colors"
              >
                📜 ಡಿಪ್ಲೋಮಾ (Diploma ₹1,500/ತಿಂಗಳು)
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCheck} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ನೋಂದಣಿ ಸಂಖ್ಯೆ (Reg No):
                </label>
                <input
                  type="text"
                  value={educationRegNo}
                  onChange={(e) => setEducationRegNo(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ಅರ್ಜಿದಾರರ ಹೆಸರು (Name):
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-semibold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ವಿದ್ಯಾರ್ಹತೆ (Qualification):
                </label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-medium"
                >
                  <option value="GRADUATE">ಪದವಿ (Graduate)</option>
                  <option value="DIPLOMA">ಡಿಪ್ಲೋಮಾ (Diploma)</option>
                  <option value="POST_GRADUATE">ಸ್ನಾತಕೋತ್ತರ (PG)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ತೇರ್ಗಡೆಯ ವರ್ಷ (Year):
                </label>
                <input
                  type="number"
                  value={passingYear}
                  onChange={(e) => setPassingYear(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ನಿರುದ್ಯೋಗ ಅವಧಿ (ತಿಂಗಳು):
                </label>
                <input
                  type="number"
                  value={monthsUnemployed}
                  onChange={(e) => setMonthsUnemployed(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold"
                  title="Months unemployed post-graduation (min 6 months)"
                  required
                />
              </div>
            </div>

            {/* Checkbox Criteria */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isKarnatakaDomicile}
                  onChange={(e) => setIsKarnatakaDomicile(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-gray-700 font-medium">
                  ಕರ್ನಾಟಕದಲ್ಲಿ ಕನಿಷ್ಠ 6 ವರ್ಷಗಳ ನಿವಾಸ (Karnataka Domicile)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!isEmployed}
                  onChange={(e) => setIsEmployed(!e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-gray-700 font-medium">
                  ಪ್ರಸ್ತುತ ಯಾವುದೇ ಉದ್ಯೋಗ ಹೊಂದಿಲ್ಲ (Currently Unemployed)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!isPursuingHigherStudies}
                  onChange={(e) => setIsPursuingHigherStudies(!e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-gray-700 font-medium">
                  ಉನ್ನತ ಶಿಕ್ಷಣದಲ್ಲಿ ಪ್ರವೇಶ ಪಡೆದಿಲ್ಲ (Not Pursuing Higher Studies)
                </span>
              </label>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                ಪಡಿತರ ಚೀಟಿ ಸಂಖ್ಯೆ (Ration Card):
              </label>
              <input
                type="text"
                value={rationCardNumber}
                onChange={(e) => setRationCardNumber(e.target.value)}
                placeholder="KA-04-9841284"
                className="w-full text-xs p-2 rounded-lg border border-gray-300 font-mono font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತಿದೆ...' : '🎓 ಯುವನಿಧಿ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ (Check Eligibility)'}
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {result && (
            <div className="space-y-4 pt-2 border-t border-gray-200 animate-in fade-in">
              {/* Verdict Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  result.eligibility.isEligible
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{result.eligibility.isEligible ? '🎉' : '⚠️'}</div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wide">
                      {result.eligibility.isEligible
                        ? `ಯುವನಿಧಿ ಅರ್ಹತೆ ದೃಢಪಟ್ಟಿದೆ (Eligible: ₹${result.eligibility.benefitAmountPerMonth}/ತಿಂಗಳು)`
                        : 'ಯುವನಿಧಿ ಮಾನದಂಡಗಳಿಗೆ ಅರ್ಹವಾಗಿಲ್ಲ'}
                    </div>
                    <div className="text-[11px] opacity-80">
                      ಅರ್ಜಿದಾರರು: <strong>{result.eligibility.applicantNameMasked}</strong> (
                      {result.eligibility.educationRegNo})
                    </div>
                  </div>
                </div>
                {result.eligibility.isEligible && (
                  <div className="text-right">
                    <span className="text-[10px] block opacity-70">ಗರಿಷ್ಠ 2 ವರ್ಷಗಳ ಭತ್ಯೆ:</span>
                    <strong className="text-sm font-extrabold text-emerald-700">
                      ₹{result.eligibility.benefitAmountPerMonth * 24} ಒಟ್ಟು
                    </strong>
                  </div>
                )}
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

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-[11px] text-gray-500">
          <span>ಕರ್ನಾಟಕ ಕೌಶಲ್ಯಾಭಿವೃದ್ಧಿ ಇಲಾಖೆ • ಯುವನಿಧಿ ಗ್ಯಾರಂಟಿ ಯೋಜನೆ</span>
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
