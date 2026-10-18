import {
  VoiceWaveLogoIcon,
  HomeIcon,
  SearchSchemesIcon,
  ApplicationsIcon,
  DocumentsIcon,
  HelpCenterIcon,
  PhoneCallIcon,
  UserAvatarIcon,
  LocationPinIcon,
  CloseIcon,
} from './icons';

export type NavItemKey = 'home' | 'schemes' | 'applications' | 'documents' | 'help';

interface SidebarProps {
  activeItem: NavItemKey;
  onSelectItem: (key: NavItemKey) => void;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
  isKannadaPrimary: boolean;
}

export function Sidebar({
  activeItem,
  onSelectItem,
  isOpenOnMobile,
  onCloseMobile,
  isKannadaPrimary,
}: SidebarProps) {
  const navItems = [
    {
      key: 'home' as NavItemKey,
      labelKn: 'ಮುಖಪುಟ',
      labelEn: 'Home',
      icon: HomeIcon,
    },
    {
      key: 'schemes' as NavItemKey,
      labelKn: 'ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ',
      labelEn: 'Find schemes',
      icon: SearchSchemesIcon,
    },
    {
      key: 'applications' as NavItemKey,
      labelKn: 'ನನ್ನ ಅರ್ಜಿಗಳು',
      labelEn: 'My applications',
      icon: ApplicationsIcon,
    },
    {
      key: 'documents' as NavItemKey,
      labelKn: 'ದಾಖಲೆಗಳು',
      labelEn: 'Documents',
      icon: DocumentsIcon,
    },
    {
      key: 'help' as NavItemKey,
      labelKn: 'ಸಹಾಯ ಕೇಂದ್ರ',
      labelEn: 'Help center',
      icon: HelpCenterIcon,
    },
  ];

  const sidebarContent = (
    <aside
      className="flex flex-col h-full bg-[#0B3B24] text-[#F3F7F4] select-none justify-between border-r border-[#134D31]"
      aria-label="JanVaani Main Navigation"
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#144E32]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#145336] text-[#FCD34D] shadow-inner ring-1 ring-white/10">
              <VoiceWaveLogoIcon className="w-6 h-6 text-[#FCD34D]" />
            </div>
            <div className="flex flex-col">
              <span className="font-kannada text-lg font-bold tracking-wide text-white leading-tight">
                ಜನವಾಣಿ
              </span>
              <span className="font-english text-xs font-semibold text-[#86EFAC] tracking-wider uppercase">
                JanVaani
              </span>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-[#144E32] focus:outline-none focus:ring-2 focus:ring-[#E68A00]"
            aria-label="Close navigation sidebar"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="px-3 py-6 space-y-1.5" aria-label="Sidebar Sections">
          {navItems.map((item) => {
            const isActive = activeItem === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelectItem(item.key);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150 relative focus:outline-none focus:ring-2 focus:ring-[#E68A00] ${
                  isActive
                    ? 'bg-[#185336] text-white shadow-sm font-semibold'
                    : 'text-[#D1E7DD] hover:bg-[#12452D] hover:text-white font-normal'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${item.labelKn} — ${item.labelEn}`}
              >
                {/* Saffron active indicator on the left */}
                {isActive && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-md bg-[#E68A00]"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-[#FCD34D]' : 'text-[#86EFAC]'
                  }`}
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-kannada text-sm leading-snug truncate">
                    {isKannadaPrimary ? item.labelKn : item.labelEn}
                  </span>
                  <span className="font-english text-[11px] text-[#A7D7C5] leading-none truncate">
                    {isKannadaPrimary ? item.labelEn : item.labelKn}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Helpline Card & User Profile */}
      <div className="p-4 space-y-4">
        {/* Helpline Card */}
        <div className="bg-[#12482E] rounded-2xl p-3.5 border border-[#1A5C3C] shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#185839] flex items-center justify-center text-[#FCD34D]">
              <PhoneCallIcon className="w-3.5 h-3.5" />
            </div>
            <span className="font-kannada text-xs font-semibold text-[#FCD34D]">
              {isKannadaPrimary ? 'ಸಹಾಯ ಬೇಕೇ?' : 'Need Help?'}
            </span>
          </div>
          <p className="font-kannada text-[11px] text-[#C2E3D2] leading-tight mb-2">
            {isKannadaPrimary ? 'ನಮ್ಮ ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ' : 'Call our citizen toll-free helpline'}
          </p>
          <a
            href="tel:18004251234"
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-[#0A301D] hover:bg-[#072416] text-[#86EFAC] hover:text-white transition-colors border border-[#1E6B44] text-xs font-bold font-english focus:outline-none focus:ring-2 focus:ring-[#E68A00]"
            aria-label="Call Karnataka Citizen Helpline 1800 425 1234"
          >
            <span className="tracking-wider">1800 425 1234</span>
            <span className="font-kannada text-[10px] text-[#FCD34D] font-normal">ಉಚಿತ</span>
          </a>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#0e4028] border border-[#185235]">
          <div className="w-10 h-10 rounded-full bg-[#185839] border border-[#277950] flex items-center justify-center text-[#FCD34D] flex-shrink-0">
            <UserAvatarIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-kannada text-sm font-bold text-white truncate">
              ರಾಧಾ ದೇವಿ
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#9CD6BA]">
              <LocationPinIcon className="w-3 h-3 text-[#E68A00] flex-shrink-0" />
              <span className="font-kannada truncate">ಮೈಸೂರು ಜಿಲ್ಲೆ</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:block w-60 lg:w-64 flex-shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        >
          <div
            className="w-72 max-w-[85vw] h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
