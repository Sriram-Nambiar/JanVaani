import { useState } from 'react';
import { ArrowRightCircleIcon, CheckCircleIcon } from './icons';

interface SchemeCardsSectionProps {
  isKannadaPrimary: boolean;
  onSelectScheme?: (schemeName: string) => void;
}

export function SchemeCardsSection({
  isKannadaPrimary,
  onSelectScheme,
}: SchemeCardsSectionProps) {
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);

  const schemes = [
    {
      id: 'gruha-lakshmi',
      categoryKn: 'ಮಹಿಳಾ ಕಲ್ಯಾಣ',
      categoryEn: "Women's Welfare",
      nameKn: 'ಗೃಹ ಲಕ್ಷ್ಮಿ ಯೋಜನೆ',
      nameEn: 'Gruha Lakshmi Scheme',
      matchScore: '98% ಹೊಂದಿಕೆ',
      matchScoreEn: '98% Match',
      benefitKn: '₹2,000 / ತಿಂಗಳು',
      benefitEn: '₹2,000 / month',
      descriptionKn:
        'ಕುಟುಂಬದ ಯಜಮಾನಿ ಮಹಿಳೆಗೆ ಪ್ರತಿ ತಿಂಗಳು ಆರ್ಥಿಕ ನೆರವು ನೀಡುವ ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಮಹತ್ವಾಕಾಂಕ್ಷಿ ಯೋಜನೆ.',
      descriptionEn:
        'Monthly financial assistance for the woman head of a household.',
      categoryAccent: {
        badgeBg: 'bg-[#FFE4E6]',
        badgeText: 'text-[#BE123C]',
        badgeBorder: 'border-[#FDA4AF]',
        borderHover: 'hover:border-[#FB7185]',
        buttonColor: 'text-[#E11D48] hover:text-[#BE123C]',
      },
    },
    {
      id: 'sandhya-suraksha',
      categoryKn: 'ಹಿರಿಯ ನಾಗರಿಕರು',
      categoryEn: 'Senior Citizens',
      nameKn: 'ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ',
      nameEn: 'Sandhya Suraksha',
      matchScore: '92% ಹೊಂದಿಕೆ',
      matchScoreEn: '92% Match',
      benefitKn: '₹1,200 / ತಿಂಗಳು',
      benefitEn: '₹1,200 / month',
      descriptionKn:
        '65 ವರ್ಷ ಮತ್ತು ಮೇಲ್ಪಟ್ಟ ಅರ್ಹ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಪ್ರತಿ ತಿಂಗಳು ನೀಡಲಾಗುವ ವೃದ್ಧಾಪ್ಯ ಮಾಶಾಸನ.',
      descriptionEn:
        'Monthly pension for eligible citizens aged 65 and above.',
      categoryAccent: {
        badgeBg: 'bg-[#EDE9FE]',
        badgeText: 'text-[#6D28D9]',
        badgeBorder: 'border-[#DDD6FE]',
        borderHover: 'hover:border-[#A78BFA]',
        buttonColor: 'text-[#7C3AED] hover:text-[#5B21B6]',
      },
    },
  ];

  return (
    <section className="mb-6" aria-labelledby="verified-schemes-title">
      {/* Header with Title and "View all" Action matching screenshot */}
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[#D97706] text-xs font-bold">✦</span>
            <span className="font-kannada text-xs font-semibold text-[#8C827A]">
              {isKannadaPrimary ? 'ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಗೆ ಹೊಂದುವ ಯೋಜನೆಗಳು' : 'Schemes matching your situation'}
            </span>
          </div>

          <h2
            id="verified-schemes-title"
            className="font-kannada text-xl sm:text-2xl font-extrabold text-[#0B3B24] tracking-tight"
          >
            {isKannadaPrimary ? 'ಪರಿಶೀಲಿಸಲಾದ ಫಲಿತಾಂಶಗಳು' : 'Verified Results'}
          </h2>
        </div>

        {/* View all action */}
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0B3B24] hover:text-[#D97706] transition-colors focus:outline-none focus:underline cursor-pointer"
          aria-label="View all welfare schemes"
        >
          <span className="font-kannada">
            {isKannadaPrimary ? 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ' : 'View all'}
          </span>
          <span className="font-english">→</span>
        </button>
      </div>

      {/* Grid of Two Scheme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        {schemes.map((scheme) => {
          const isSelected = selectedScheme === scheme.id;
          return (
            <article
              key={scheme.id}
              onClick={() => {
                setSelectedScheme(scheme.id);
                if (onSelectScheme) onSelectScheme(scheme.nameKn);
              }}
              className={`rounded-2xl bg-white border border-[#E5DFD3] p-4 sm:p-5 transition-all duration-200 shadow-2xs flex flex-col justify-between cursor-pointer ${scheme.categoryAccent.borderHover} hover:shadow-md ${
                isSelected ? 'ring-2 ring-[#0B3B24] border-[#0B3B24]' : ''
              }`}
              aria-label={`${scheme.nameKn} — ${scheme.nameEn}`}
            >
              <div>
                {/* Top Row: Category Pill & Verified Match Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {/* Category Accent Badge */}
                  <span
                    className={`font-kannada text-xs font-bold px-2.5 py-1 rounded-lg border ${scheme.categoryAccent.badgeBg} ${scheme.categoryAccent.badgeText} ${scheme.categoryAccent.badgeBorder}`}
                  >
                    {isKannadaPrimary ? scheme.categoryKn : scheme.categoryEn}
                  </span>

                  {/* Verified Match Badge */}
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF5EE] text-[#15803D] border border-[#CDE5D5] text-xs font-bold font-kannada">
                    <CheckCircleIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#15803D]" />
                    <span>
                      {isKannadaPrimary ? scheme.matchScore : scheme.matchScoreEn}
                    </span>
                  </div>
                </div>

                {/* Scheme Name & English Supporting Text */}
                <h3 className="font-kannada text-xl font-bold text-[#0B3B24] leading-snug">
                  {scheme.nameKn}
                </h3>
                <span className="font-english text-xs font-semibold text-[#8C827A] block mb-3">
                  {scheme.nameEn}
                </span>

                {/* Short Description */}
                <p className="font-kannada text-xs sm:text-sm text-[#4A453E] leading-relaxed mb-4">
                  {isKannadaPrimary ? scheme.descriptionKn : scheme.descriptionEn}
                </p>
              </div>

              {/* Benefit Section & Circular Arrow Action */}
              <div className="pt-4 border-t border-[#F2ECE1] flex items-center justify-between">
                <div>
                  <span className="font-kannada text-[11px] font-semibold text-[#78716C] block leading-tight">
                    {isKannadaPrimary ? 'ಮಾಸಿಕ ಆರ್ಥಿಕ ನೆರವು' : 'Monthly Financial Benefit'}
                  </span>
                  <span className="font-kannada text-lg sm:text-xl font-extrabold text-[#0B3B24] tracking-tight">
                    {isKannadaPrimary ? scheme.benefitKn : scheme.benefitEn}
                  </span>
                </div>

                {/* Circular Arrow Button */}
                <button
                  type="button"
                  className={`p-1.5 rounded-full transition-transform transform group-hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-[#0B3B24] ${scheme.categoryAccent.buttonColor}`}
                  aria-label={`View details for ${scheme.nameEn}`}
                >
                  <ArrowRightCircleIcon className="w-8 h-8" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
