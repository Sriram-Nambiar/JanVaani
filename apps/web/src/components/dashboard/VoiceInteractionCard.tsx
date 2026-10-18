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
      className="relative overflow-hidden rounded-3xl border border-[#D2E4D7] bg-gradient-to-br from-[#EBF5EE] via-[#F3F8F2] to-[#FAF8EE] p-6 sm:p-8 lg:p-10 shadow-sm mb-8 transition-all duration-300"
      aria-label="Voice interaction hero card"
    >
      <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">
        {/* Left Side: Status, Heading, Example Prompt & Privacy */}
        <div className="flex-1 w-full text-left space-y-4 sm:space-y-5">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 border bg-white/90 shadow-2xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isListening
                  ? 'bg-[#E11D48] animate-ping'
                  : 'bg-[#15803D]'
              }`}
              aria-hidden="true"
            />
            <span
              className={`font-kannada ${
                isListening ? 'text-[#BE123C] font-bold' : 'text-[#15803D]'
              }`}
            >
              {isListening
                ? isKannadaPrimary
                  ? 'ನಿಮ್ಮ ಮಾತು ಕೇಳುತ್ತಿದೆ'
                  : 'Listening to your voice…'
                : isKannadaPrimary
                ? 'ಮಾತನಾಡಲು ಸಿದ್ಧವಾಗಿದೆ'
                : 'Ready to speak'}
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="font-kannada text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B3B24] tracking-tight leading-snug">
              {isListening
                ? isKannadaPrimary
                  ? 'ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ…'
                  : 'I am listening…'
                : isKannadaPrimary
                ? 'ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ'
                : 'Press the mic and speak'}
            </h2>
            <p className="font-english text-xs sm:text-sm text-[#5B635D] mt-1">
              {isListening
                ? 'Please speak in Kannada: mention your age, income, family size or land'
                : 'Kannada conversational AI recognizes rural dialects and natural speech'}
            </p>
          </div>

          {/* Example Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 border border-[#D8E6DC] shadow-2xs">
            <span className="font-kannada text-xs font-bold text-[#854D0E] block mb-1">
              {isKannadaPrimary ? 'ಉದಾಹರಣೆಗೆ ಹೀಗೆ ಹೇಳಿ:' : 'Example utterance to try:'}
            </span>
            <p className="font-kannada text-sm sm:text-base font-medium text-[#1A3324] italic leading-relaxed">
              “ನನಗೆ 68 ವರ್ಷ, ತಿಂಗಳಿಗೆ ಯಾವುದೇ ಆದಾಯವಿಲ್ಲ”
            </p>
            <span className="font-english text-xs text-[#6F756F] block mt-0.5">
              “I am 68 years old, and have no monthly income”
            </span>
          </div>

          {/* Privacy Message with Shield Icon */}
          <div className="flex items-center gap-2 text-[#2E5841]">
            <div className="w-5 h-5 rounded-md bg-[#D9EFE0] flex items-center justify-center flex-shrink-0 text-[#15803D]">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-[#15803D]" />
            </div>
            <span className="font-kannada text-xs font-semibold">
              {isKannadaPrimary
                ? 'ನಿಮ್ಮ ಮಾತು ಸುರಕ್ಷಿತ ಮತ್ತು ಖಾಸಗಿಯಾಗಿದೆ'
                : 'Your voice is secure, encrypted, and strictly private'}
            </span>
          </div>
        </div>

        {/* Right Side: Microphone Button, Concentric Rings & Waveform */}
        <div className="flex flex-col items-center justify-center relative flex-shrink-0 py-4">
          <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64">
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
              className={`absolute inset-4 rounded-full border-2 transition-all duration-700 pointer-events-none ${
                isListening
                  ? 'border-[#F43F5E]/40 animate-pulse-ring-delayed'
                  : 'border-[#B2D8BD]/40'
              }`}
              aria-hidden="true"
            />
            <div
              className={`absolute inset-9 rounded-full bg-white/50 border border-white/80 transition-all duration-500 pointer-events-none shadow-xs`}
              aria-hidden="true"
            />

            {/* Large Circular Microphone Button */}
            <button
              type="button"
              onClick={handleToggleListening}
              className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 ${
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
              <MicrophoneIcon className="w-9 h-9 sm:w-10 sm:h-10 transition-transform" />
              <span className="font-kannada text-[10px] sm:text-xs font-bold mt-1 text-white/95">
                {isListening ? 'ನಿಲ್ಲಿಸಿ' : 'ಮಾತನಾಡಿ'}
              </span>
            </button>
          </div>

          {/* Small Waveform Visualization */}
          <div
            className="flex items-center gap-1.5 h-8 mt-2 px-4 py-1.5 rounded-full bg-white/70 border border-[#D5E4D8] shadow-2xs"
            aria-label="Voice waveform indicator"
          >
            {[40, 75, 100, 60, 90, 45, 80, 50, 95, 35].map((height, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isListening
                    ? 'bg-[#E11D48] animate-wave-bar'
                    : 'bg-[#0D472A]/40'
                }`}
                style={{
                  height: isListening ? `${height}%` : '25%',
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
