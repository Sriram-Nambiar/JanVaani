import { useState } from 'react';
import { Sidebar, NavItemKey } from './Sidebar';
import { TopHeader } from './TopHeader';
import { WelcomeSection } from './WelcomeSection';
import { VoiceInteractionCard } from './VoiceInteractionCard';
import { SchemeCardsSection } from './SchemeCardsSection';
import { WhatsAppNextStepCard } from './WhatsAppNextStepCard';
import { Footer } from './Footer';
import { VoiceWaveLogoIcon } from './icons';

interface JanVaaniDashboardProps {
  onSwitchToCopilot?: () => void;
  onSwitchToMockServers?: () => void;
}

export function JanVaaniDashboard({
  onSwitchToCopilot,
  onSwitchToMockServers,
}: JanVaaniDashboardProps) {
  const [activeNav, setActiveNav] = useState<NavItemKey>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isKannadaPrimary, setIsKannadaPrimary] = useState(true);
  const [voiceQueryStatus, setVoiceQueryStatus] = useState<string | null>(null);

  const handleToggleLanguage = () => {
    setIsKannadaPrimary((prev) => !prev);
  };

  const handleVoiceRecorded = async (transcript: string) => {
    setVoiceQueryStatus(transcript);
    // Call backend API if available
    try {
      await fetch('/api/dashboard/voice-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          citizenPhone: '9876543210',
          language: isKannadaPrimary ? 'kn' : 'en',
        }),
      });
    } catch {
      // Gracefully continue
    }
  };

  const handleDispatchWhatsApp = async () => {
    try {
      await fetch('/api/dashboard/whatsapp-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenPhone: '9876543210',
          applicantName: 'ರಾಧಾ ದೇವಿ',
          district: 'ಮೈಸೂರು',
          schemeIds: ['gruha-lakshmi', 'sandhya-suraksha'],
        }),
      });
    } catch {
      // Gracefully continue
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A2E22] flex flex-col md:flex-row antialiased selection:bg-[#E68A00] selection:text-white">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeItem={activeNav}
        onSelectItem={(item) => setActiveNav(item)}
        isOpenOnMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isKannadaPrimary={isKannadaPrimary}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* 2. Top Header */}
        <TopHeader
          isKannadaPrimary={isKannadaPrimary}
          onToggleLanguage={handleToggleLanguage}
          onOpenMobileSidebar={() => setIsMobileMenuOpen(true)}
          hasUnreadNotifications={true}
        />

        {/* Developer / Portal Switcher Bar */}
        {(onSwitchToCopilot || onSwitchToMockServers) && (
          <div className="bg-[#EFE9DD] border-b border-[#E1D8CA] px-4 md:px-8 py-2 flex items-center justify-between text-xs text-[#5D554B]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#15803D]" />
              <span className="font-kannada font-semibold text-[#0B3B24]">
                ಜನವಾಣಿ ಲೈವ್ ಪೋರ್ಟಲ್ — ಸಕ್ರಿಯವಾಗಿದೆ
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onSwitchToCopilot && (
                <button
                  type="button"
                  onClick={onSwitchToCopilot}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF8F5] text-[#0B3B24] border border-[#D5CFBF] font-semibold text-[11px] shadow-2xs transition-colors focus:outline-none focus:ring-1 focus:ring-[#0B3B24]"
                >
                  WhatsApp Copilot & Inspector
                </button>
              )}
              {onSwitchToMockServers && (
                <button
                  type="button"
                  onClick={onSwitchToMockServers}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF8F5] text-[#991B1B] border border-[#D5CFBF] font-semibold text-[11px] shadow-2xs transition-colors focus:outline-none focus:ring-1 focus:ring-[#991B1B]"
                >
                  Mock Government Servers
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Main Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-6xl w-full mx-auto">
          {/* Demo & WhatsApp Bot Roadmap Banner */}
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0B3B24] via-[#104D30] to-[#15803D] text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#22c55e]/20">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-xl border border-white/10">
                🌐
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#FEF3C7] text-[#854D0E] text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {isKannadaPrimary ? 'ಲೈವ್ ವೆಬ್ ಡೆಮೊ' : 'Live Web Demo'}
                  </span>
                  <span className="text-xs text-[#86EFAC] font-semibold">
                    {isKannadaPrimary ? 'ಜನವಾಣಿ ಸಿಟಿಜನ್ ವೆಬ್ ಪೋರ್ಟಲ್' : 'JanVaani Citizen Web Portal'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#E2E8F0] font-medium leading-relaxed">
                  {isKannadaPrimary
                    ? 'ಈಗ ನೀವು ಜನವಾಣಿಯನ್ನು ವೆಬ್‌ಸೈಟ್ ರೂಪದಲ್ಲಿ ಅನುಭವಿಸುತ್ತಿದ್ದೀರಿ. ಮುಂದಿನ ಹಂತದಲ್ಲಿ, ಪ್ರತಿಯೊಬ್ಬ ನಾಗರಿಕರಿಗೆ ಯಾವುದೇ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಇಲ್ಲದೆ ನೇರ WhatsApp Voice & Chatbot ಮೂಲಕ ಲಭ್ಯವಾಗಲಿದೆ!'
                    : 'Experiencing JanVaani in web interactive demo mode. Next milestone: Direct WhatsApp Voice & Chat Bot rollout for 6.5 Cr citizens with zero app downloads!'}
                </p>
              </div>
            </div>

            {onSwitchToCopilot && (
              <button
                type="button"
                onClick={onSwitchToCopilot}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-[#072718] font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap self-stretch md:self-auto"
              >
                <span>💬 {isKannadaPrimary ? 'WhatsApp ಬಾಟ್ ಮುನ್ನೋಟ' : 'Preview WhatsApp Bot'}</span>
                <span className="bg-black/10 px-1.5 py-0.5 rounded text-[10px] font-mono">SOON</span>
              </button>
            )}
          </div>

          {/* 3. Welcome Section */}
          <WelcomeSection isKannadaPrimary={isKannadaPrimary} />

          {/* 4. Voice Interaction Card */}
          <VoiceInteractionCard
            isKannadaPrimary={isKannadaPrimary}
            onVoiceRecorded={handleVoiceRecorded}
          />

          {/* Optional Voice Transcript Feedback Pill */}
          {voiceQueryStatus && (
            <div className="mb-6 px-4 py-3 rounded-2xl bg-[#EAF5EE] border border-[#B9E2C6] flex items-center justify-between text-xs text-[#0B3B24]">
              <div className="flex items-center gap-2">
                <VoiceWaveLogoIcon className="w-4 h-4 text-[#15803D] flex-shrink-0" />
                <span className="font-kannada font-semibold">
                  ಕೇಳಿಸಿಕೊಂಡ ಮಾತು: “{voiceQueryStatus}”
                </span>
              </div>
              <span className="text-[#15803D] font-bold font-kannada">ಪರಿಶೀಲಿಸಲಾಗಿದೆ ✓</span>
            </div>
          )}

          {/* 5. Verified Scheme Results */}
          <SchemeCardsSection
            isKannadaPrimary={isKannadaPrimary}
          />

          {/* 6. WhatsApp Next Step Card */}
          <WhatsAppNextStepCard
            isKannadaPrimary={isKannadaPrimary}
            onDispatchWhatsApp={handleDispatchWhatsApp}
          />

          {/* 7. Footer */}
          <Footer isKannadaPrimary={isKannadaPrimary} />
        </main>
      </div>
    </div>
  );
}
