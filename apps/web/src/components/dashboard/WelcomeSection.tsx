interface WelcomeSectionProps {
  isKannadaPrimary: boolean;
}

export function WelcomeSection({ isKannadaPrimary }: WelcomeSectionProps) {
  // Format current Karnataka time & date
  const now = new Date();
  
  // Format day and date in Kannada
  const kannadaMonths = [
    'ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್',
    'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್'
  ];

  const currentMonthKn = kannadaMonths[now.getMonth()];
  const currentDayNum = now.getDate();
  const currentYear = now.getFullYear();

  return (
    <section className="mb-4 sm:mb-5" aria-label="Welcome and citizen greeting">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Welcome Text */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="font-kannada text-xs sm:text-sm font-semibold text-[#854D0E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
              {isKannadaPrimary ? 'ನಮಸ್ಕಾರ, ರಾಧಾ ಅವರೇ' : 'Namaskara, Radha avare'}
            </span>
            <span className="font-english text-xs text-[#71685F] hidden sm:inline">
              | Seva Sindhu 2.0 Citizen Portal
            </span>
          </div>

          <h1 className="font-kannada text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B3B24] tracking-tight leading-snug">
            {isKannadaPrimary ? 'ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?' : 'How may I assist you today?'}
          </h1>

          <p className="font-kannada text-xs sm:text-sm text-[#4A453E] max-w-2xl leading-relaxed">
            {isKannadaPrimary
              ? 'ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ಹೇಳಿ. ಸೂಕ್ತ ಸರ್ಕಾರಿ ಯೋಜನೆಯನ್ನು ನಾವು ಹುಡುಕುತ್ತೇವೆ.'
              : 'Describe your situation or household needs in conversational Kannada. JanVaani instantly identifies verified welfare schemes.'}
          </p>
        </div>

        {/* Date Display aligned with screenshot */}
        <div className="self-start md:self-center flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white border border-[#E7E0D2] shadow-2xs">
          <div className="flex flex-col text-right">
            <span className="font-kannada text-[10px] font-bold text-[#8C827A] leading-tight">
              {isKannadaPrimary ? 'ಇಂದು' : 'Today'}
            </span>
            <span className="font-kannada text-xs font-semibold text-[#5D554B] leading-tight">
              {isKannadaPrimary ? `${currentMonthKn} ${currentYear}` : `${now.toLocaleString('en-IN', { month: 'short' })} ${currentYear}`}
            </span>
          </div>
          <span className="font-english text-2xl sm:text-3xl font-black text-[#0B3B24] leading-none pl-2 border-l border-[#E7E0D2]">
            {currentDayNum}
          </span>
        </div>
      </div>
    </section>
  );
}
