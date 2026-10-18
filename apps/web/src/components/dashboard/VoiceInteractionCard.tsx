import { useState } from 'react';
import { MicrophoneIcon, ShieldCheckIcon } from './icons';

interface VoiceInteractionCardProps {
  isKannadaPrimary: boolean;
  onVoiceRecorded?: (transcript: string) => void;
}

export function VoiceInteractionCard({
  isKannadaPrimary,
  onVoiceRecorded,
}: VoiceInteractionCardProps) {
  const [isListening, setIsListening] = useState(false);

  const handleToggleListening = () => {
    const nextState = !isListening;
    setIsListening(nextState);

    if (nextState) {
      // Simulate real-time speech recognition after 2.5 seconds
      setTimeout(() => {
        setIsListening(false);
        if (onVoiceRecorded) {
          onVoiceRecorded('ನನಗೆ 68 ವರ್ಷ, ತಿಂಗಳಿಗೆ ಯಾವುದೇ ಆದಾಯವಿಲ್ಲ');
        }
      }, 3500);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-[#D2E4D7] bg-gradient-to-br from-[#EBF5EE] via-[#F3F8F2] to-[#FAF8EE] p-5 sm:p-6 lg:p-7 shadow-xs mb-6 transition-all duration-300"
      aria-label="Voice interaction hero card"
    >
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10">
        {/* Left Side: Status, Heading, Example Prompt & Privacy */}
        <div className="flex-1 w-full text-left space-y-3 sm:space-y-4">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border bg-white/90 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isListening
                  ? 'bg-[#E11D48] animate-ping'
                  : 'bg-[#15803D]'
              }`}
              aria-hidden="true"
            />
            <span
              className={`font-kannada text-xs ${
                isListening ? 'text-[#BE123C] font-bold' : 'text-[#15803D]'
              }`}
            >
              {isListening
                ? isKannadaPrimary
                  ? 'ನಿಮ್ಮ ಮಾತು ಕೇಳುತ್ತಿದೆ'
                  : 'Listening…'
                : isKannadaPrimary
                ? 'ಮಾತನಾಡಲು ಸಿದ್ಧವಾಗಿದೆ'
                : 'Ready to speak'}
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="font-kannada text-2xl sm:text-3xl font-extrabold text-[#0B3B24] tracking-tight leading-snug">
              {isListening
                ? isKannadaPrimary
                  ? 'ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ…'
                  : 'I am listening…'
                : isKannadaPrimary
                ? 'ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ'
                : 'Press the mic and speak'}
            </h2>
            <p className="font-kannada text-xs sm:text-sm text-[#5B635D] mt-1.5 leading-relaxed">
              {isKannadaPrimary
                ? 'ಉದಾಹರಣೆಗೆ: “ನನಗೆ 68 ವರ್ಷ, ತಿಂಗಳಿಗೆ ಯಾವುದೇ ಆದಾಯವಿಲ್ಲ”'
                : 'Example: “I am 68 years old, and have no monthly income”'}
            </p>
          </div>

          {/* Privacy Message with Shield Icon */}
          <div className="flex items-center gap-1.5 text-[#2E5841] pt-1">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-[#15803D] flex-shrink-0" />
            <span className="font-kannada text-xs text-[#4A453E]">
              {isKannadaPrimary
                ? 'ನಿಮ್ಮ ಮಾತು ಸುರಕ್ಷಿತ ಮತ್ತು ಖಾಸಗಿಯಾಗಿದೆ'
                : 'Your voice is secure, encrypted, and strictly private'}
            </span>
          </div>
        </div>

        {/* Right Side: Microphone Button, Concentric Rings & Waveform */}
        <div className="flex flex-col items-center justify-center relative flex-shrink-0">
          <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40">
            {/* Concentric Circular Rings */}
            <div
              className={`absolute inset-0 rounded-full border-2 transition-all duration-700 pointer-events-none ${
                isListening
                  ? 'border-[#FDA4AF] animate-pulse-ring'
                  : 'border-[#C8E4D1]/60'
              }`}
              aria-hidden="true"
            />
            <div
              className={`absolute inset-3 rounded-full border-2 transition-all duration-700 pointer-events-none ${
                isListening
                  ? 'border-[#F43F5E]/40 animate-pulse-ring-delayed'
                  : 'border-[#B2D8BD]/40'
              }`}
              aria-hidden="true"
            />
            <div
              className="absolute inset-6 rounded-full bg-white/60 border border-white/80 pointer-events-none shadow-xs"
              aria-hidden="true"
            />

            {/* Circular Microphone Button */}
            <button
              type="button"
              onClick={handleToggleListening}
              className={`relative z-10 w-18 h-18 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-md cursor-pointer transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 ${
                isListening
                  ? 'bg-[#E11D48] hover:bg-[#BE123C] text-white focus:ring-[#FDA4AF] shadow-[#E11D48]/30'
                  : 'bg-[#0D472A] hover:bg-[#09361F] text-white focus:ring-[#86EFAC] shadow-[#0D472A]/30'
              }`}
              aria-label={
                isListening
                  ? 'Stop listening'
                  : 'Start voice interaction in Kannada'
              }
              aria-pressed={isListening}
            >
              <MicrophoneIcon className="w-8 h-8 sm:w-9 sm:h-9 text-white transition-transform" />
            </button>
          </div>

          {/* Waveform Visualization directly below */}
          <div
            className="flex items-center gap-1 h-5 mt-1 px-3 py-1 rounded-full bg-white/70 border border-[#D5E4D8] shadow-2xs"
            aria-label="Voice waveform indicator"
          >
            {[40, 75, 100, 60, 90, 45, 80, 50, 95, 35].map((height, idx) => (
              <span
                key={idx}
                className={`w-0.5 rounded-full transition-all duration-200 ${
                  isListening
                    ? 'bg-[#E11D48] animate-wave-bar'
                    : 'bg-[#0D472A]/40'
                }`}
                style={{
                  height: isListening ? `${height}%` : '30%',
                  animationDelay: `${idx * 0.1}s`,
                }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
