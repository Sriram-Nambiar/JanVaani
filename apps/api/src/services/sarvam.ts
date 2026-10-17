/**
 * Sarvam AI Service Integration for JanVaani
 * Supports:
 * - Saaras Speech-to-Text (kn-IN)
 * - Bulbul Text-to-Speech (kn-IN)
 * - Seamless Mock / Live Mode switching via SARVAM_API_KEY
 */

export interface SpeechToTextResult {
  transcript: string;
  languageCode: string;
  confidence: number;
  isMock: boolean;
}

export interface TextToSpeechResult {
  audioBase64: string;
  format: 'wav' | 'mp3';
  transcriptText: string;
  isMock: boolean;
}

// Minimal valid 1-second 8kHz mono WAV header in base64 (silent dummy wave) so browsers can load and play without error
const SILENT_WAV_BASE64 =
  'UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export class SarvamService {
  private apiKey: string | undefined;
  private isLive: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SARVAM_API_KEY;
    this.isLive = Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('placeholder'));
  }

  public isMockMode(): boolean {
    return !this.isLive;
  }

  /**
   * Transcribe Kannada speech to text using Sarvam Saaras
   */
  async speechToText(
    audioData: { base64?: string; buffer?: Buffer; mimeType?: string },
    scenarioHint?: string
  ): Promise<SpeechToTextResult> {
    if (this.isLive && (audioData.buffer || audioData.base64)) {
      try {
        const buffer = audioData.buffer || Buffer.from(audioData.base64!, 'base64');
        const formData = new FormData();
        const blob = new Blob([buffer as unknown as BlobPart], { type: audioData.mimeType || 'audio/wav' });
        formData.append('file', blob, 'recording.wav');
        formData.append('model', 'saaras:v1');
        formData.append('language_code', 'kn-IN');

        const response = await fetch('https://api.sarvam.ai/speech-to-text', {
          method: 'POST',
          headers: {
            'api-subscription-key': this.apiKey!,
          },
          body: formData,
        });

        if (response.ok) {
          const json = await response.json() as { transcript?: string };
          if (json.transcript) {
            return {
              transcript: json.transcript,
              languageCode: 'kn-IN',
              confidence: 0.95,
              isMock: false,
            };
          }
        }
      } catch (err) {
        // Fallback to mock on network or API failure during hackathon testing
        console.warn('Sarvam API STT failed, falling back to simulated engine:', err);
      }
    }

    // Mock / Simulated Mode:
    let transcript = 'ನನ್ನ ಹೆಸರು ಸವಿತಾ, ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಹಾಕಬೇಕು. ನನ್ನ ರೇಷನ್ ಕಾರ್ಡ್ ನಂಬರ್ RC9876543210, ಮಂಡ್ಯ ತಾಲೂಕು.';

    if (scenarioHint === 'caste_income_apply') {
      transcript = 'ನನಗೆ 2A ಪ್ರವರ್ಗದ ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಬೇಕು. ವಾರ್ಷಿಕ ಆದಾಯ ಒಂದು ಲಕ್ಷ ರೂಪಾಯಿ.';
    } else if (scenarioHint === 'gruha_jyothi_apply') {
      transcript = 'ನನಗೆ 200 ಯೂನಿಟ್ ಉಚಿತ ಕರೆಂಟ್ ಗೃಹ ಜ್ಯೋತಿ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಹಾಕಬೇಕು. ನನ್ನ ಹೆಸರು ಸವಿತಾ.';
    } else if (scenarioHint === 'gruha_jyothi_submit_agent') {
      transcript = 'ನನ್ನ ಕರೆಂಟ್ ಬಿಲ್ ಅಕೌಂಟ್ ಐಡಿ 1029384756, ಬೆಂಗಳೂರು ಬೆಸ್ಕಾಂ (BESCOM), ಬಾಡಿಗೆದಾರ.';
    } else if (scenarioHint === 'status_check_rd001' || scenarioHint?.includes('RD001')) {
      transcript = 'ನನ್ನ ಅರ್ಜಿ ಸಂಖ್ಯೆ RD001, ಇದರ ಸ್ಥಿತಿ ಏನು?';
    } else if (scenarioHint === 'status_check_rd002' || scenarioHint?.includes('RD002')) {
      transcript = 'ನನ್ನ ಅರ್ಜಿ ಸಂಖ್ಯೆ RD002, ಇದರ ಪ್ರಗತಿ ತಿಳಿಸಿ.';
    } else if (scenarioHint === 'status_check_rd003' || scenarioHint?.includes('RD003')) {
      transcript = 'ನನ್ನ ಅರ್ಜಿ ಸಂಖ್ಯೆ RD003, ಯಾವ ಹಂತದಲ್ಲಿದೆ?';
    }

    return {
      transcript,
      languageCode: 'kn-IN',
      confidence: 0.92,
      isMock: true,
    };
  }

  /**
   * Synthesize Kannada speech from text using Sarvam Bulbul
   */
  async textToSpeech(text: string, speaker: string = 'meera'): Promise<TextToSpeechResult> {
    if (this.isLive && text.trim().length > 0) {
      try {
        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': this.apiKey!,
          },
          body: JSON.stringify({
            inputs: [text],
            target_language_code: 'kn-IN',
            speaker: speaker,
            pitch: 0,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 8000,
            enable_preprocessing: true,
            model: 'bulbul:v1',
          }),
        });

        if (response.ok) {
          const json = await response.json() as { audios?: string[] };
          if (json.audios && json.audios.length > 0) {
            return {
              audioBase64: json.audios[0],
              format: 'wav',
              transcriptText: text,
              isMock: false,
            };
          }
        }
      } catch (err) {
        console.warn('Sarvam API TTS failed, falling back to simulated audio:', err);
      }
    }

    // Mock / Simulated Mode:
    return {
      audioBase64: SILENT_WAV_BASE64,
      format: 'wav',
      transcriptText: text,
      isMock: true,
    };
  }
}

export const sarvamService = new SarvamService();
