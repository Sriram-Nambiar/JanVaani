import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  audioBase64?: string;
  transcriptText?: string;
  durationSeconds?: number;
  isCitizen?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBase64,
  transcriptText,
  durationSeconds = 12,
  isCitizen = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Stop any previously playing audio or speech synthesis when audioBase64 changes
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setProgress(0);

    if (audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setProgress(0);
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [audioBase64]);

  const speakFallback = (text?: string): boolean => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlaying(false);
      setProgress(0);
      return false;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'kn-IN';
      utterance.rate = playbackSpeed;
      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(0);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setProgress(0);
      };
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      return true;
    } catch {
      setIsPlaying(false);
      setProgress(0);
      return false;
    }
  };

  const togglePlay = () => {
    if (!isPlaying) {
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // If browser blocks audio or dummy WAV is empty, fallback to Web Speech
            const fallbackStarted = speakFallback(transcriptText);
            if (!fallbackStarted) {
              setIsPlaying(false);
              setProgress(0);
            }
          });
      } else if (transcriptText) {
        const fallbackStarted = speakFallback(transcriptText);
        if (!fallbackStarted) {
          setIsPlaying(false);
          setProgress(0);
        }
      } else {
        setIsPlaying(false);
        setProgress(0);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const cycleSpeed = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 8px',
        borderRadius: '8px',
        backgroundColor: isCitizen ? '#dcf8c6' : '#ffffff',
        width: '100%',
        maxWidth: '280px',
      }}
    >
      <button
        onClick={togglePlay}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#075e54',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          flexShrink: 0,
        }}
        title={isPlaying ? 'Pause' : 'Play Audio Note'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          style={{
            height: '4px',
            backgroundColor: '#d1d5db',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${isPlaying ? (progress > 0 ? progress : 10) : 0}%`,
              height: '100%',
              backgroundColor: '#128c7e',
              transition: 'width 0.2s linear',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
          <span>{isPlaying ? 'ನುಡಿಯುತ್ತಿದೆ...' : `0:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`}</span>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#075e54' }}>ಕನ್ನಡ ಧ್ವನಿ (Sarvam)</span>
        </div>
      </div>

      <button
        onClick={cycleSpeed}
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          padding: '2px 6px',
          borderRadius: '10px',
          border: '1px solid #9ca3af',
          backgroundColor: '#f3f4f6',
          color: '#374151',
          cursor: 'pointer',
        }}
        title="Playback Speed"
      >
        {playbackSpeed}x
      </button>
    </div>
  );
};
