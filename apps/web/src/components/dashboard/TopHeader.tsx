import {
  ShieldCheckIcon,
  BellIcon,
  MenuIcon,
  VoiceWaveLogoIcon,
} from './icons';

interface TopHeaderProps {
  isKannadaPrimary: boolean;
  onToggleLanguage: () => void;
  onOpenMobileSidebar: () => void;
  onSwitchToCopilot?: () => void;
  onSwitchToMockServers?: () => void;
  hasUnreadNotifications?: boolean;
}

export function TopHeader({
  isKannadaPrimary,
  onToggleLanguage,
  onOpenMobileSidebar,
  onSwitchToCopilot,
  hasUnreadNotifications = true,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-20 w-full h-14 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E2D9] px-4 md:px-8 flex items-center justify-between transition-colors">
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

        {/* Desktop / Tablet: Official Verification Badge matching screenshot */}
        <div className="hidden sm:flex items-center gap-2 text-[#0B3B24]">
          <ShieldCheckIcon className="w-4 h-4 text-[#15803D] flex-shrink-0" />
          <span className="font-kannada text-xs font-semibold tracking-wide text-[#0B3B24]">
            ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಪರಿಶೀಲಿತ ಮಾಹಿತಿ
          </span>
          <span className="hidden xl:inline text-[11px] text-[#4B7A5F] font-english">
            (Govt of Karnataka Verified)
          </span>
        </div>
      </div>

      {/* Right Controls: WhatsApp Bot Switcher + Language toggle + Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick WhatsApp Bot Roadmap Pill */}
        {onSwitchToCopilot && (
          <button
            type="button"
            onClick={onSwitchToCopilot}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C6E6D1] bg-[#EAF5EE] hover:bg-[#D7EFE0] text-[#0B3B24] text-xs font-bold transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B3B24]"
            title="Preview future WhatsApp Bot experience"
          >
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span className="font-english text-[11px]">WhatsApp Bot</span>
            <span className="bg-[#25D366]/20 text-[#075E54] text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">SOON</span>
          </button>
        )}

        {/* Verification indicator for extra small mobile */}
        <div className="sm:hidden flex items-center text-[#15803D]" title="ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಪರಿಶೀಲಿತ ಮಾಹಿತಿ">
          <ShieldCheckIcon className="w-4 h-4" />
        </div>

        {/* Kannada / English language dropdown pill matching screenshot */}
        <button
          type="button"
          onClick={onToggleLanguage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D5CFBF] bg-white hover:bg-[#F4EFE6] text-[#0B3B24] text-xs font-semibold transition-all duration-150 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0B3B24] cursor-pointer"
          aria-label={
            isKannadaPrimary
              ? 'Switch language to English'
              : 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ'
          }
        >
          <span className="text-[#D97706] font-bold text-xs font-kannada">ಅ</span>
          <span className="font-kannada font-semibold text-xs text-[#0B3B24]">
            {isKannadaPrimary ? 'ಕನ್ನಡ' : 'English'}
          </span>
          <span className="text-[10px] text-[#78716C] ml-0.5">▾</span>
        </button>

        {/* Notification button with unread indicator */}
        <button
          type="button"
          className="relative p-2 rounded-xl border border-[#D5CFBF] bg-white hover:bg-[#F4EFE6] text-[#0B3B24] transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0B3B24] cursor-pointer"
          aria-label="View notifications — 1 unread notification"
        >
          <BellIcon className="w-4 h-4 text-[#4A453E]" />
          {hasUnreadNotifications && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E11D48] ring-2 ring-white"
              aria-label="Unread indicator"
            />
          )}
        </button>
      </div>
    </header>
  );
}
