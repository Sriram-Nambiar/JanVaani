import { ShieldCheckIcon, VoiceWaveLogoIcon } from './icons';

interface FooterProps {
  isKannadaPrimary: boolean;
}

export function Footer({ isKannadaPrimary }: FooterProps) {
  return (
    <footer
      className="mt-12 pt-8 pb-12 border-t border-[#E7E2D9] text-[#5C554D] text-xs font-kannada"
      aria-label="JanVaani civic footer"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Verification Banner */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#EAF5EE] text-[#15803D] flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="w-4 h-4 text-[#15803D]" />
          </div>
          <span className="font-bold text-[#0B3B24] tracking-wide text-xs sm:text-sm">
            {isKannadaPrimary
              ? 'ನಿಖರ, ಪರಿಶೀಲಿತ ಮತ್ತು ಸುರಕ್ಷಿತ'
              : 'Accurate, Verified and Secure'}
          </span>
          <span className="text-[#A8A29E] font-english hidden md:inline">
            | Powered by Government of Karnataka Digital Public Goods
          </span>
        </div>

        {/* Brand Tagline */}
        <div className="flex items-center gap-2 text-center sm:text-right">
          <VoiceWaveLogoIcon className="w-4 h-4 text-[#D97706] hidden sm:inline" />
          <p className="font-bold text-[#0B3B24]">
            JanVaani · <span className="font-normal text-[#44403C]">ಜನರ ಧ್ವನಿ, ಜನರ ಹಕ್ಕು</span>
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#F2ECE1] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#78716C]">
        <p>
          © 2026 Seva Sindhu 2.0 & JanVaani Initiative. ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.
        </p>
        <p className="font-english">
          Designed for accessibility, voice-first usability, and digital inclusion across Karnataka.
        </p>
      </div>
    </footer>
  );
}
