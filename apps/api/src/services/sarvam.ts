/**
 * Sarvam AI Service Integration for JanVaani
 * Supports:
 * - Saaras Speech-to-Text (kn-IN)
 * - Bulbul Text-to-Speech (kn-IN)
 * - Seamless Mock / Live Mode switching via SARVAM_API_KEY
 */

import { audioCache } from './audio-cache.js';

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

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResult {
  reply: string;
  isMock: boolean;
}

export class SarvamService {
  private apiKey: string | undefined;
  private isLive: boolean;

  constructor(apiKey?: string) {
    if (apiKey !== undefined) {
      this.apiKey = apiKey;
    } else if (process.env.NODE_ENV === 'test') {
      this.apiKey = undefined;
    } else {
      this.apiKey = process.env.SARVAM_API_KEY;
    }
    this.isLive = Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('placeholder'));
  }

  public isMockMode(): boolean {
    return !this.isLive;
  }

  /**
   * Transcribe Kannada speech to text using Sarvam Saaras (saaras:v3)
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
        formData.append('model', 'saaras:v3');
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
        } else {
          console.warn('Sarvam API STT error response status:', response.status);
        }
      } catch {
        // Fallback to mock on network or API failure during testing
        console.warn('Sarvam API STT failed, falling back to simulated engine');
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
   * Synthesize Kannada speech from text using Sarvam Bulbul (bulbul:v3)
   */
  async textToSpeech(text: string, speaker: string = 'kavitha'): Promise<TextToSpeechResult> {
    const cached = audioCache.get(text, speaker, 'bulbul:v3');
    if (cached) {
      return cached;
    }

    let result: TextToSpeechResult;

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
            model: 'bulbul:v3',
          }),
        });

        if (response.ok) {
          const json = await response.json() as { audios?: string[] };
          if (json.audios && json.audios.length > 0) {
            result = {
              audioBase64: json.audios[0],
              format: 'wav',
              transcriptText: text,
              isMock: false,
            };
            audioCache.set(text, speaker, result, 'bulbul:v3');
            return result;
          }
        } else {
          console.warn('Sarvam API TTS error response status:', response.status);
        }
      } catch {
        console.warn('Sarvam API TTS failed, falling back to simulated audio');
      }
    }

    // Mock / Simulated Mode:
    result = {
      audioBase64: SILENT_WAV_BASE64,
      format: 'wav',
      transcriptText: text,
      isMock: true,
    };
    // Only cache if configured in mock mode, avoiding caching transient live API failures
    if (!this.isLive) {
      audioCache.set(text, speaker, result, 'bulbul:v3');
    }
    return result;
  }

  /**
   * Conversational Chat Completion using Sarvam-105B (sarvam-105b-conversations)
   */
  async chatCompletion(
    messages: ChatMessage[],
    systemPrompt?: string
  ): Promise<ChatCompletionResult> {
    if (this.isLive) {
      try {
        const fullMessages: ChatMessage[] = [];
        if (systemPrompt) {
          fullMessages.push({ role: 'system', content: systemPrompt });
        }
        fullMessages.push(...messages);

        const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': this.apiKey!,
          },
          body: JSON.stringify({
            model: 'sarvam-105b-conversations',
            messages: fullMessages,
          }),
        });

        if (response.ok) {
          const json = await response.json() as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const reply = json.choices?.[0]?.message?.content;
          if (reply) {
            return {
              reply,
              isMock: false,
            };
          }
        } else {
          console.warn('Sarvam Chat Completion error status:', response.status);
        }
      } catch {
        console.warn('Sarvam Chat Completion request failed');
      }
    }

    return {
      reply: 'ನಮಸ್ಕಾರ! ಜನವಾಣಿ ನಾಗರಿಕ ಸೇವಾ ಕೇಂದ್ರಕ್ಕೆ ಸ್ವಾಗತ. ಗೃಹಲಕ್ಷ್ಮಿ, ಗೃಹಜ್ಯೋತಿ, ಅನ್ನಭಾಗ್ಯ, ಶಕ್ತಿ ಅಥವಾ ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರಗಳ ಕುರಿತು ಮಾಹಿತಿ ಪಡೆಯಬಹುದು.',
      isMock: true,
    };
  }
}

export const sarvamService = new SarvamService();
