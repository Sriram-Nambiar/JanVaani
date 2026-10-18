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
        {/* 2. Top Header with WhatsApp Bot quick switcher */}
        <TopHeader
          isKannadaPrimary={isKannadaPrimary}
          onToggleLanguage={handleToggleLanguage}
          onOpenMobileSidebar={() => setIsMobileMenuOpen(true)}
          onSwitchToCopilot={onSwitchToCopilot}
          onSwitchToMockServers={onSwitchToMockServers}
          hasUnreadNotifications={true}
        />

        {/* Scrollable Main Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl w-full mx-auto">
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
