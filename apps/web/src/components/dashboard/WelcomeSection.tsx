import { CalendarIcon } from './icons';

interface WelcomeSectionProps {
  isKannadaPrimary: boolean;
}

export function WelcomeSection({ isKannadaPrimary }: WelcomeSectionProps) {
  // Format current Karnataka time & date
  const now = new Date();
  
  // Format day and date in Kannada
  const kannadaDays = ['ಭಾನುವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'];
  const kannadaMonths = [
    'ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್',
    'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್'
  ];

  const currentDayKn = kannadaDays[now.getDay()];
  const currentMonthKn = kannadaMonths[now.getMonth()];
  const currentDayNum = now.getDate();
  const currentYear = now.getFullYear();

  const formattedDateKn = `${currentDayKn}, ${currentDayNum} ${currentMonthKn} ${currentYear}`;
  const formattedDateEn = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="mb-6 sm:mb-8" aria-label="Welcome and citizen greeting">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Welcome Text */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="font-kannada text-sm font-semibold text-[#854D0E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
              {isKannadaPrimary ? 'ನಮಸ್ಕಾರ, ರಾಧಾ ಅವರೇ' : 'Namaskara, Radha avare'}
            </span>
            <span className="font-english text-xs text-[#71685F] hidden sm:inline">
              | Seva Sindhu 2.0 Citizen Portal
            </span>
          </div>

          <h1 className="font-kannada text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B3B24] tracking-tight leading-snug">
            {isKannadaPrimary ? 'ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?' : 'How may I assist you today?'}
          </h1>

          <p className="font-kannada text-sm sm:text-base text-[#4A453E] max-w-2xl leading-relaxed pt-1">
            {isKannadaPrimary
              ? 'ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿ ಅಥವಾ ಅಗತ್ಯವನ್ನು ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ ತಿಳಿಸಿ. ನಿಮ್ಮ ವಯಸ್ಸು, ಆದಾಯ ಮತ್ತು ಕುಟುಂಬದ ವಿವರಗಳ ಆಧಾರದ ಮೇಲೆ ಅರ್ಹವಾದ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ನಾವು ತಕ್ಷಣ ಹುಡುಕುತ್ತೇವೆ.'
              : 'Describe your situation or household needs in conversational Kannada. JanVaani instantly identifies verified welfare schemes and benefits matched to your eligibility.'}
          </p>
        </div>

        {/* Small Date Card showing current day and date */}
        <div className="self-start md:self-center flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-[#E5DFD3] shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#F4EFE6] text-[#0B3B24] flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-5 h-5 text-[#0B3B24]" />
          </div>
          <div className="flex flex-col">
            <span className="font-kannada text-xs font-bold text-[#0B3B24] leading-tight">
              {isKannadaPrimary ? formattedDateKn : formattedDateEn}
            </span>
            <span className="font-english text-[11px] text-[#71685F] leading-tight">
              {isKannadaPrimary ? formattedDateEn : formattedDateKn}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
