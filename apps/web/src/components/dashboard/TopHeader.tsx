import {
  ShieldCheckIcon,
  BellIcon,
  LanguageIcon,
  MenuIcon,
  VoiceWaveLogoIcon,
} from './icons';

interface TopHeaderProps {
  isKannadaPrimary: boolean;
  onToggleLanguage: () => void;
  onOpenMobileSidebar: () => void;
  hasUnreadNotifications?: boolean;
}

export function TopHeader({
  isKannadaPrimary,
  onToggleLanguage,
  onOpenMobileSidebar,
  hasUnreadNotifications = true,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-20 w-full h-16 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E7E2D9] px-4 md:px-8 flex items-center justify-between transition-colors">
      {/* Mobile brand & hamburger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl text-[#0B3B24] hover:bg-[#EBE5DB] focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Small JanVaani wordmark on mobile */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0B3B24] flex items-center justify-center text-[#FCD34D]">
            <VoiceWaveLogoIcon className="w-4 h-4 text-[#FCD34D]" />
          </div>
          <div className="flex flex-col">
            <span className="font-kannada text-sm font-bold text-[#0B3B24] leading-tight">
              ಜನವಾಣಿ
            </span>
            <span className="font-english text-[9px] font-bold text-[#D97706] tracking-wider uppercase leading-none">
              JanVaani
            </span>
          </div>
        </div>

        {/* Desktop / Tablet: Official Verification Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF5EE] border border-[#C6E6D1] text-[#0B3B24] shadow-xs">
          <ShieldCheckIcon className="w-4 h-4 text-[#15803D] flex-shrink-0" />
          <span className="font-kannada text-xs font-semibold tracking-wide">
            ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಪರಿಶೀಲಿತ ಮಾಹಿತಿ
          </span>
          <span className="hidden lg:inline text-[11px] text-[#4B7A5F] font-english">
            (Govt of Karnataka Verified)
          </span>
        </div>
      </div>

      {/* Right Controls: Language toggle + Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Verification indicator for extra small mobile */}
        <div className="sm:hidden flex items-center text-[#15803D]" title="ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಪರಿಶೀಲಿತ ಮಾಹಿತಿ">
          <ShieldCheckIcon className="w-4 h-4" />
        </div>

        {/* Kannada / English language toggle */}
        <button
          type="button"
          onClick={onToggleLanguage}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#D5CFBF] bg-white hover:bg-[#F4EFE6] text-[#0B3B24] text-xs font-semibold transition-all duration-150 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
          aria-label={
            isKannadaPrimary
              ? 'Switch language to English'
              : 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ'
          }
        >
          <LanguageIcon className="w-4 h-4 text-[#D97706]" />
          <div className="flex items-center gap-1">
            <span
              className={`font-kannada transition-colors ${
                isKannadaPrimary ? 'text-[#0B3B24] font-bold' : 'text-[#8C827A]'
              }`}
            >
              ಕನ್ನಡ
            </span>
            <span className="text-[#D5CFBF]">/</span>
            <span
              className={`font-english transition-colors ${
                !isKannadaPrimary ? 'text-[#0B3B24] font-bold' : 'text-[#8C827A]'
              }`}
            >
              Eng
            </span>
          </div>
        </button>

        {/* Notification button with unread indicator */}
        <button
          type="button"
          className="relative p-2 rounded-xl border border-[#D5CFBF] bg-white hover:bg-[#F4EFE6] text-[#0B3B24] transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
          aria-label="View notifications — 1 unread notification"
        >
          <BellIcon className="w-5 h-5" />
          {hasUnreadNotifications && (
            <span
              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#E11D48] ring-2 ring-white"
              aria-label="Unread indicator"
            />
          )}
        </button>
      </div>
    </header>
  );
}
