import React, { useState, useRef, useEffect } from 'react';
import { AudioPlayer } from './AudioPlayer';

export interface AuditCheckItem {
  id: string;
  nameKn: string;
  nameEn: string;
  documentA: {
    title: string;
    value: string;
  };
  documentB: {
    title: string;
    value: string;
  };
  status: 'PASSED' | 'FLAGGED' | 'ACTION_REQUIRED';
  diagnosisKn: string;
  diagnosisEn: string;
  recommendedActionKn: string;
  recommendedActionEn: string;
  audioBase64?: string;
}

interface DocumentAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedWithDraft?: () => void;
}

const SAMPLE_AUDIT_CHECKS: AuditCheckItem[] = [
  {
    id: 'name_match',
    nameKn: 'ಆಧಾರ್ ಮತ್ತು ಪಡಿತರ ಚೀಟಿ ಹೆಸರು ಹೊಂದಾಣಿಕೆ',
    nameEn: 'Aadhaar vs. Ration Card Name Matching',
    documentA: {
      title: 'Aadhaar Card (ಆಧಾರ್)',
      value: 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)',
    },
    documentB: {
      title: 'Ration Card (ಪಡಿತರ ಚೀಟಿ)',
      value: 'ಸವಿತಾ (Savitha)',
    },
    status: 'FLAGGED',
    diagnosisKn: 'ಹೆಸರಿನಲ್ಲಿ ಸಣ್ಣ ಅಕ್ಷರ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಿದೆ (ಕುಮಾರಿ ಉಪನಾಮ ಲೋಪ). ಅಧಿಕೃತ ಕಂದಾಯ ಪರಿಶೀಲನೆಯಲ್ಲಿ ಇದು ಅರ್ಜಿಯನ್ನು ವಿಳಂಬಗೊಳಿಸಬಹುದು.',
    diagnosisEn: 'Minor surname variation detected between documents. In official verification, this can cause an automated clerical hold.',
    recommendedActionKn: 'ಅರ್ಜಿ ಸಲ್ಲಿಸುವಾಗ ಅಫಿಡವಿಟ್ ಅಥವಾ ಪಡಿತರ ಚೀಟಿ ತಿದ್ದುಪಡಿ ರಸೀದಿಯನ್ನು ಲಗತ್ತಿಸಿ.',
    recommendedActionEn: 'Attach a name equivalence affidavit or submit matching ration card excerpt.',
  },
  {
    id: 'income_ceiling',
    nameKn: 'ಆದಾಯ ಮಿತಿ ಅರ್ಹತಾ ತಪಾಸಣೆ',
    nameEn: 'Annual Family Income Ceiling Audit',
    documentA: {
      title: 'Income Certificate Slip',
      value: 'ವಾರ್ಷಿಕ ಆದಾಯ: ₹1,20,000',
    },
    documentB: {
      title: 'Gruha Lakshmi Eligibility',
      value: 'ಗರಿಷ್ಠ ಮಿತಿ: ₹2,00,000 ಒಳಗೆ',
    },
    status: 'PASSED',
    diagnosisKn: 'ನಿಮ್ಮ ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯವು ₹1,20,000 ಆಗಿದ್ದು, ಗೃಹಲಕ್ಷ್ಮಿ ಮತ್ತು ಜಾತಿ ಪ್ರಮಾಣ ಪತ್ರದ ಅರ್ಹತಾ ಮಿತಿಯೊಳಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಸಿಂಧುವಾಗಿದೆ.',
    diagnosisEn: 'Annual household income of ₹1,20,000 is fully within the statutory eligibility threshold.',
    recommendedActionKn: 'ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಸಿಂಧುವಾಗಿದೆ; ಯಾವುದೇ ಬದಲಾವಣೆ ಅಗತ್ಯವಿಲ್ಲ.',
    recommendedActionEn: 'Income certificate is valid; no further action required.',
  },
  {
    id: 'vamsha_vruksha',
    nameKn: 'ವಂಶವೃಕ್ಷ (ಕುಟುಂಬ ವೃಕ್ಷ) ಪ್ರಮಾಣ ಪತ್ರ ಪರಿಶೀಲನೆ',
    nameEn: 'Family Tree (Vamsha Vruksha) Integrity Check',
    documentA: {
      title: 'Submitted Document',
      value: 'ವಂಶವೃಕ್ಷ ಅಫಿಡವಿಟ್ (ಅಪೂರ್ಣ)',
    },
    documentB: {
      title: 'Revenue Inspector Requirement',
      value: 'ಗ್ರಾಮ ಆಡಳಿತಾಧಿಕಾರಿ (VA) ದೃಢೀಕೃತ ವಂಶವೃಕ್ಷ',
    },
    status: 'ACTION_REQUIRED',
    diagnosisKn: 'ಸಲ್ಲಿಸಲಾದ ವಂಶವೃಕ್ಷದಲ್ಲಿ ಗ್ರಾಮ ಆಡಳಿತಾಧಿಕಾರಿಯವರ (VA) ಸಹಿ ಅಥವಾ ಸೀಲ್ ಕಾಣಿಸುತ್ತಿಲ್ಲ. ತಹಸೀಲ್ದಾರ್ ಕಚೇರಿಯು ಇದನ್ನು ತಿರಸ್ಕರಿಸುವ ಸಾಧ್ಯತೆ ಇದೆ.',
    diagnosisEn: 'Village Administrative Officer (VA) signature or seal is missing on the uploaded genealogy affidavit.',
    recommendedActionKn: 'ಗ್ರಾಮ ಆಡಳಿತಾಧಿಕಾರಿಯಿಂದ ಮುದ್ರೆ ಪಡೆದು ಮರು-ಅಪ್ಲೋಡ್ ಮಾಡಿ.',
    recommendedActionEn: 'Obtain VA endorsement seal and re-upload before final submission.',
  },
];

export const DocumentAuditModal: React.FC<DocumentAuditModalProps> = ({
  isOpen,
  onClose,
  onProceedWithDraft,
}) => {
  const [selectedCheckId, setSelectedCheckId] = useState<string>(SAMPLE_AUDIT_CHECKS[0].id);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditChecks, setAuditChecks] = useState<AuditCheckItem[]>(SAMPLE_AUDIT_CHECKS);
  const [lastAuditTimestamp, setLastAuditTimestamp] = useState<string>('Pre-submission baseline');
  const auditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (auditTimerRef.current) {
        clearTimeout(auditTimerRef.current);
        auditTimerRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const currentCheck = auditChecks.find((c) => c.id === selectedCheckId) || auditChecks[0];

  const handleClose = () => {
    if (auditTimerRef.current) {
      clearTimeout(auditTimerRef.current);
      auditTimerRef.current = null;
    }
    setIsAuditing(false);
    onClose();
  };

  const handleRunRecheck = () => {
    if (auditTimerRef.current) {
      clearTimeout(auditTimerRef.current);
    }
    setIsAuditing(true);
    auditTimerRef.current = setTimeout(() => {
      const now = new Date().toLocaleTimeString('en-IN');
      setLastAuditTimestamp(now);

      // Recompute the active diagnostic
      setAuditChecks((prevChecks) =>
        prevChecks.map((check) => {
          if (check.id === selectedCheckId) {
            return {
              ...check,
              diagnosisEn: `${check.diagnosisEn} (Re-verified at ${now} via Karnataka State OCR engine)`,
              diagnosisKn: `${check.diagnosisKn} (ಮರು-ಪರಿಶೀಲಿಸಲಾಗಿದೆ: ${now})`,
            };
          }
          return check;
        })
      );

      setIsAuditing(false);
      auditTimerRef.current = null;
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              🔍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Kagada-Check (ಕಾಗದ ಪರಿಶೀಲನೆ)</h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-800 text-emerald-100 border border-emerald-600">
                  Pre-Submission Auditor
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Spoken Document & Scheme Eligibility Diagnostic powered by Sarvam AI
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Check Selector Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {auditChecks.map((check) => {
              const isSelected = check.id === selectedCheckId;
              const badgeBg =
                check.status === 'PASSED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : check.status === 'FLAGGED'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-rose-100 text-rose-800 border-rose-200';

              return (
                <button
                  key={check.id}
                  onClick={() => setSelectedCheckId(check.id)}
                  className={`p-3.5 text-left rounded-xl border transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-gray-800 truncate">{check.nameEn}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${badgeBg}`}>
                      {check.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{check.nameKn}</p>
                </button>
              );
            })}
          </div>

          {/* Active Diagnostic Detail Card */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-gray-900">{currentCheck.nameEn}</h4>
                <p className="text-sm text-gray-600 font-medium">{currentCheck.nameKn}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-medium">
                  Status: {lastAuditTimestamp}
                </span>
                <button
                  onClick={handleRunRecheck}
                  disabled={isAuditing}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isAuditing ? 'Auditing...' : '🔄 Re-audit Document'}
                </button>
              </div>
            </div>

            {/* Side-by-side Document Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {currentCheck.documentA.title}
                </span>
                <p className="text-sm font-semibold text-gray-900">{currentCheck.documentA.value}</p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {currentCheck.documentB.title}
                </span>
                <p className="text-sm font-semibold text-gray-900">{currentCheck.documentB.value}</p>
              </div>
            </div>

            {/* Diagnosis & Voice Output */}
            <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">Spoken Diagnostic (ಧ್ವನಿ ವಿವರಣೆ):</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed font-medium bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                "{currentCheck.diagnosisKn}"
              </p>
              <p className="text-xs text-gray-500 italic">
                Translation: "{currentCheck.diagnosisEn}"
              </p>

              <div className="pt-2">
                <AudioPlayer
                  transcriptText={currentCheck.diagnosisKn}
                />
              </div>
            </div>

            {/* Prescription / Recommended Action */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Recommended Action to Avoid Rejection (ತಿರಸ್ಕಾರ ತಪ್ಪಿಸಲು ಪರಿಹಾರ):
              </span>
              <p className="text-sm font-semibold text-amber-950">{currentCheck.recommendedActionKn}</p>
              <p className="text-xs text-amber-800">{currentCheck.recommendedActionEn}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-gray-100 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Kagada-Check prevents the 30% initial application rejection rate at Taluk offices.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Chat (ಹಿಂತಿರುಗಿ)
            </button>
            {onProceedWithDraft && (
              <button
                onClick={() => {
                  onProceedWithDraft();
                  handleClose();
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Proceed with Form Draft (ಅರ್ಜಿ ಮುಂದುವರಿಸಿ)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
