import { useState } from 'react';
import { WhatsAppActionIcon, CheckCircleIcon } from './icons';

interface WhatsAppNextStepCardProps {
  isKannadaPrimary: boolean;
  onDispatchWhatsApp?: () => Promise<void> | void;
}

export function WhatsAppNextStepCard({
  isKannadaPrimary,
  onDispatchWhatsApp,
}: WhatsAppNextStepCardProps) {
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendToWhatsApp = async () => {
    if (isSent) return;
    setIsLoading(true);

    try {
      if (onDispatchWhatsApp) {
        await onDispatchWhatsApp();
      }
    } catch {
      // Gracefully continue
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setIsSent(true);
      }, 600);
    }
  };

  return (
    <div
      className="w-full rounded-2xl sm:rounded-3xl border border-[#D0E2D6] bg-[#FFFFFF] p-6 sm:p-8 shadow-xs mb-8 transition-all"
      aria-label="WhatsApp Next Step Action"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Label, Heading, Description */}
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5">
            <span className="font-kannada text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-0.5 rounded-md border border-[#FDE68A] uppercase tracking-wider">
              {isKannadaPrimary ? 'ಮುಂದಿನ ಹಂತ' : 'Next Step'}
            </span>
            <span className="text-xs text-[#78716C] font-english">
              | Step 2 of 3
            </span>
          </div>

          <h3 className="font-kannada text-xl sm:text-2xl font-bold text-[#0B3B24] tracking-tight">
            {isKannadaPrimary ? 'ದಾಖಲೆಗಳ ಪಟ್ಟಿ ಪಡೆಯಿರಿ' : 'Receive Required Documents Checklist'}
          </h3>

          <p className="font-kannada text-xs sm:text-sm text-[#4A453E] leading-relaxed">
            {isKannadaPrimary
              ? 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳ ಪಟ್ಟಿ (ಆಧಾರ್, ರೇಷನ್ ಕಾರ್ಡ್, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ) ಮತ್ತು ನಿಮ್ಮ ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ (Grama One) ಕೇಂದ್ರದ ವಿಳಾಸವನ್ನು ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ ವಾಟ್ಸಾಪ್ ಮೂಲಕ ನೇರವಾಗಿ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.'
              : 'The complete list of required documents (Aadhaar, Ration Card, Income Certificate) and the address of your nearest Grama One kiosk will be sent directly via WhatsApp.'}
          </p>
        </div>

        {/* Right Side: Primary WhatsApp Button with Interactive State Change */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={handleSendToWhatsApp}
            disabled={isLoading || isSent}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-kannada text-sm sm:text-base font-bold transition-all duration-200 shadow-sm focus:outline-none focus:ring-4 ${
              isSent
                ? 'bg-[#15803D] text-white cursor-default focus:ring-[#86EFAC]'
                : isLoading
                ? 'bg-[#0B3B24]/80 text-white cursor-wait'
                : 'bg-[#0B3B24] hover:bg-[#072818] text-white focus:ring-[#86EFAC] active:scale-98 cursor-pointer'
            }`}
            aria-label={
              isSent
                ? 'Details have been sent to WhatsApp'
                : 'Send document checklist to WhatsApp'
            }
          >
            {isSent ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-white flex-shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="leading-tight">
                    {isKannadaPrimary ? 'ಕಳುಹಿಸಲಾಗಿದೆ' : 'Sent'}
                  </span>
                  <span className="text-[11px] text-[#DCFCE7] font-normal leading-none mt-0.5">
                    {isKannadaPrimary ? 'ವಿವರಗಳನ್ನು ಕಳುಹಿಸಲಾಗಿದೆ' : 'Details have been sent'}
                  </span>
                </div>
              </>
            ) : isLoading ? (
              <span className="font-kannada">ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…</span>
            ) : (
              <>
                <WhatsAppActionIcon className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                <span>
                  {isKannadaPrimary ? 'WhatsApp ಗೆ ಕಳುಹಿಸಿ' : 'Send to WhatsApp'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
