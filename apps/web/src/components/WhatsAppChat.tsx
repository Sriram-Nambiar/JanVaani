import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, WhatsAppMessagePayload, WhatsAppApiResponse } from '../types';
import { sendWhatsAppMessage } from '../api';
import { AudioPlayer } from './AudioPlayer';

interface WhatsAppChatProps {
  onEngineUpdate: (data: WhatsAppApiResponse) => void;
  onDispatchAgent?: (data: any) => void;
  onOpenDraftModal?: (ackNumber: string) => void;
  onOpenGrievanceModal?: () => void;
  pushedMessage?: ChatMessage | null;
}

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  onEngineUpdate,
  onDispatchAgent,
  onOpenDraftModal,
  onOpenGrievanceModal,
  pushedMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'janvaani',
      type: 'voice',
      text: 'ನಮಸ್ಕಾರ! ನಾನು ಜನವಾಣಿ (JanVaani). ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ, ಜಾತಿ/ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರಕ್ಕೆ ಅರ್ಜಿ ಹಾಕಲು ಅಥವಾ ನಿಮ್ಮ ಅರ್ಜಿ ಸ್ಥಿತಿ ತಿಳಿಯಲು ಧ್ವನಿ ಸಂದೇಶ (Voice Note) ಕಳುಹಿಸಿ.',
      timestamp: '10:00 AM',
    },
  ]);

  useEffect(() => {
    if (pushedMessage) {
      setMessages((prev) => {
        // Prevent duplicate push message addition
        if (prev.some((m) => m.id === pushedMessage.id)) return prev;
        return [...prev, pushedMessage];
      });
    }
  }, [pushedMessage]);

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore if inactive on unmount
        }
      }
    };
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (payload: WhatsAppMessagePayload, userDisplayMessage?: ChatMessage) => {
    if (userDisplayMessage) {
      setMessages((prev) => [...prev, userDisplayMessage]);
      setTimeout(scrollToBottom, 50);
    }

    setIsLoading(true);

    try {
      const response = await sendWhatsAppMessage(payload);
      onEngineUpdate(response);

      const janvaaniMsg: ChatMessage = {
        id: `jv-${Date.now()}`,
        sender: 'janvaani',
        type: 'voice',
        text: response.messageKn,
        audioBase64: response.audioBase64,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feature: response.feature,
        formDraft: response.formDraft,
        auditResult: response.auditResult,
        statusRecord: response.statusRecord,
      };

      setMessages((prev) => [...prev, janvaaniMsg]);
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'janvaani',
        type: 'text',
        text: `ದೋಷ ಸಂಭವಿಸಿದೆ: ${err.message || 'ಸರ್ವರ್ ಸಂಪರ್ಕ ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Text input submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'citizen',
      type: 'text',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const textToSend = inputText;
    setInputText('');
    handleSend({ type: 'text', text: textToSend, senderId: 'citizen-demo-user' }, userMsg);
  };

  // 2. Preset scenario click
  const triggerPreset = (scenario: string, labelKn: string) => {
    const isImage = scenario.startsWith('document_check');
    const isStatus = scenario.startsWith('status_check');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'citizen',
      type: isImage ? 'image' : 'voice',
      text: labelKn,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    handleSend(
      {
        type: isImage ? 'image' : isStatus ? 'voice' : 'voice',
        presetScenario: scenario as any,
        documentType: 'aadhaar',
        senderId: 'citizen-demo-user',
      },
      userMsg
    );
  };

  // 3. Live Microphone Recording via MediaRecorder
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onerror = () => {
        clearTimer();
        setIsRecording(false);
      };

      stream.getTracks().forEach((track) => {
        track.onended = () => {
          stopRecording();
        };
      });

      mediaRecorder.onstop = async () => {
        clearTimer();
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          const userVoiceMsg: ChatMessage = {
            id: `usr-${Date.now()}`,
            sender: 'citizen',
            type: 'voice',
            text: 'ಧ್ವನಿ ಸಂದೇಶ (Kannada Voice Note)',
            audioBase64: base64Audio,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          handleSend({ type: 'voice', audioBase64: base64Audio, mimeType: 'audio/webm', senderId: 'citizen-demo-user' }, userVoiceMsg);
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      clearTimer();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      clearTimer();
      setIsRecording(false);
      alert('ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ಸಿಗಲಿಲ್ಲ. ಡೆಮೊಗಾಗಿ ಕೆಳಗಿನ ಸನ್ನಿವೇಶ ಬಟನ್‌ಗಳನ್ನು ಬಳಸಬಹುದು.');
    }
  };

  const stopRecording = () => {
    clearTimer();
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore if already inactive
      }
    }
  };

  // 4. File Document Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sender: 'citizen',
        type: 'image',
        text: `ದಾಖಲೆ ಅಪ್‌ಲೋಡ್: ${file.name}`,
        imageUrl: reader.result as string,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      handleSend({ type: 'image', imageBase64: base64, documentType: 'aadhaar', senderId: 'citizen-demo-user' }, userMsg);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#efeae2',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* WhatsApp App Header */}
      <div
        style={{
          padding: '10px 16px',
          backgroundColor: '#075e54',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#25d366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: '#ffffff',
            fontWeight: 'bold',
          }}
        >
          ಜ
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>ಜನವಾಣಿ (JanVaani)</div>
          <div style={{ fontSize: '12px', color: '#c5ecd3' }}>
            ● Online (ಕನ್ನಡ Sarvam AI • ಧ್ವನಿ ಸಹಾಯಕ)
          </div>
        </div>
        <span
          style={{
            fontSize: '11px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '3px 8px',
            borderRadius: '12px',
          }}
        >
          WhatsApp Verified
        </span>
      </div>

      {/* Preset Scenarios Chips for Fast Demoing */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#f0f2f5',
          borderBottom: '1px solid #e1e4e8',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', alignSelf: 'center' }}>
          ಡೆಮೊ ಸನ್ನಿವೇಶಗಳು:
        </span>
        <button
          type="button"
          aria-label="Apply for BMTC Student Concessional Pass"
          onClick={() => {
            const userMsg: ChatMessage = {
              id: `usr-${Date.now()}`,
              sender: 'citizen',
              type: 'text',
              text: 'i want apply for bmtc student pass',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            handleSend({ type: 'text', text: 'i want apply for bmtc student pass', senderId: 'citizen-demo-user' }, userMsg);
          }}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '14px',
            border: '1px solid #1e3a8a',
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          🚌 BMTC Student Pass
        </button>
        <button
          type="button"
          aria-label="Confirm BMTC Pass OTP 3344"
          onClick={() => {
            const userMsg: ChatMessage = {
              id: `usr-${Date.now()}`,
              sender: 'citizen',
              type: 'text',
              text: 'Confirm OTP 3344',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            handleSend({ type: 'text', text: 'Confirm OTP 3344', senderId: 'citizen-demo-user' }, userMsg);
          }}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '14px',
            border: '1px solid #047857',
            backgroundColor: '#047857',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          ✅ Confirm BMTC Pass
        </button>
        <button
          onClick={() => triggerPreset('gruha_jyothi_apply', 'ಗೃಹ ಜ್ಯೋತಿ 200 ಯೂನಿಟ್ ಉಚಿತ ಕರೆಂಟ್ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಹಾಕಬೇಕು')}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '14px',
            border: '1px solid #0284c7',
            backgroundColor: '#ffffff',
            color: '#0369a1',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ⚡ ಗೃಹ ಜ್ಯೋತಿ (ವಿದ್ಯುತ್)
        </button>
        <button
          onClick={() => {
            triggerPreset('gruha_jyothi_submit_agent', 'ಖಾತೆ ಸಂಖ್ಯೆ 1029384756, ಬೆಸ್ಕಾಂ (BESCOM) ಏಜೆಂಟ್ ಸಲ್ಲಿಕೆ');
            if (onDispatchAgent) {
              onDispatchAgent({
                schemeId: 'gruha_jyothi',
                consumerId: '1029384756',
                applicantName: 'ಸವಿತಾ ಕುಮಾರಿ',
                escomName: 'BESCOM',
              });
            }
          }}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '14px',
            border: '1px solid #800000',
            backgroundColor: '#800000',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🤖 ಸೇವಾ ಸಿಂಧು ಏಜೆಂಟ್ ಸಲ್ಲಿಕೆ
        </button>
        <button
          type="button"
          aria-label="Ask Sarvam AI"
          onClick={() => {
            const userMsg: ChatMessage = {
              id: `usr-${Date.now()}`,
              sender: 'citizen',
              type: 'text',
              text: 'ನಮಸ್ಕಾರ, ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಯೋಜನೆಗಳ ಪಟ್ಟಿ ತಿಳಿಸಿ',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            handleSend({ type: 'text', text: 'ನಮಸ್ಕಾರ, ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಯೋಜನೆಗಳ ಪಟ್ಟಿ ತಿಳಿಸಿ', senderId: 'citizen-demo-user' }, userMsg);
          }}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '14px',
            border: '1px solid #7c3aed',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          💬 ಸರ್ವಂ AI ಪ್ರಶ್ನೆ (Sarvam-105B)
        </button>
        <button
          onClick={() => triggerPreset('gruha_lakshmi_apply', 'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಹಾಕಬೇಕು')}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '14px',
            border: '1px solid #128c7e',
            backgroundColor: '#ffffff',
            color: '#075e54',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          🎙️ ಗೃಹಲಕ್ಷ್ಮಿ ಅರ್ಜಿ
        </button>
        <button
          onClick={() => triggerPreset('caste_income_apply', '2A ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಬೇಕು')}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '14px',
            border: '1px solid #128c7e',
            backgroundColor: '#ffffff',
            color: '#075e54',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          🎙️ ಜಾತಿ/ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ
        </button>
        <button
          onClick={() => triggerPreset('document_check_mismatch', 'ಆಧಾರ್ ಮತ್ತು ರೇಷನ್ ಕಾರ್ಡ್ ಪರಿಶೀಲಿಸಿ')}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '14px',
            border: '1px solid #dc2626',
            backgroundColor: '#ffffff',
            color: '#b91c1c',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          ⚠️ ದಾಖಲೆ ದೋಷ ತಪಾಸಣೆ
        </button>
        <button
          onClick={() => triggerPreset('status_check_rd001', 'ಅರ್ಜಿ RD001 ಸ್ಥಿತಿ ತಿಳಿಸಿ')}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '14px',
            border: '1px solid #ea580c',
            backgroundColor: '#ffffff',
            color: '#c2410c',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          🔔 ಅರ್ಜಿ ಸ್ಥಿತಿ (RD001)
        </button>
        <button
          onClick={() => {
            if (onOpenGrievanceModal) {
              onOpenGrievanceModal();
            } else {
              triggerPreset('grievance_appeal', 'ನನ್ನ ಅರ್ಜಿ ತಿರಸ್ಕೃತವಾಗಿದೆ, ಜನಸ್ಪಂದನದಲ್ಲಿ ದೂರು ದಾಖಲಿಸಬೇಕು');
            }
          }}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '14px',
            border: '1px solid #b45309',
            backgroundColor: '#fffbeb',
            color: '#92400e',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🏛️ ಜನಸ್ಪಂದನ ದೂರು (1902)
        </button>
      </div>

      {/* Messages Feed */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.map((msg) => {
          const isCitizen = msg.sender === 'citizen';
          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isCitizen ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                backgroundColor: isCitizen ? '#dcf8c6' : '#ffffff',
                borderRadius: isCitizen ? '10px 0 10px 10px' : '0 10px 10px 10px',
                padding: '8px 12px',
                boxShadow: '0 1px 1px rgba(0,0,0,0.13)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {msg.type === 'voice' && (
                <AudioPlayer
                  audioBase64={msg.audioBase64}
                  transcriptText={msg.text}
                  isCitizen={isCitizen}
                />
              )}

              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Document"
                  style={{ maxWidth: '200px', borderRadius: '6px', maxHeight: '140px', objectFit: 'cover' }}
                />
              )}

              {msg.text && (
                <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.45', color: '#111827' }}>
                  {msg.text}
                </p>
              )}

              {(() => {
                const ackMatch = msg.text?.match(/\b(GJ-[A-Z]+-\d{4}-[0-9A-F]{6,10}|RD\d{3})\b/i);
                if (ackMatch && onOpenDraftModal) {
                  return (
                    <button
                      onClick={() => onOpenDraftModal(ackMatch[1].toUpperCase())}
                      style={{
                        marginTop: '4px',
                        padding: '5px 10px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '6px',
                        color: '#166534',
                        fontWeight: 600,
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        alignSelf: 'flex-start',
                      }}
                    >
                      <span>📄</span>
                      <span>ಅರ್ಜಿ ಕರಡು ವೀಕ್ಷಿಸಿ (View Draft PDF)</span>
                    </button>
                  );
                }
                return null;
              })()}

              <span
                style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  alignSelf: 'flex-end',
                  marginTop: '2px',
                }}
              >
                {msg.timestamp} {isCitizen && '✓✓'}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#ffffff',
              borderRadius: '0 10px 10px 10px',
              padding: '8px 14px',
              fontSize: '12px',
              color: '#075e54',
              fontStyle: 'italic',
              boxShadow: '0 1px 1px rgba(0,0,0,0.13)',
            }}
          >
            ಜನವಾಣಿ ಧ್ವನಿ ರೆಕಾರ್ಡ್ ಮಾಡುತ್ತಿದೆ... (Processing via Sarvam AI...)
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* WhatsApp Input Bar */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#f0f2f5',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileUpload}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            color: '#54656f',
            cursor: 'pointer',
            padding: '4px',
          }}
          title="ದಾಖಲೆ ಫೋಟೋ ಕಳುಹಿಸಿ (Upload Document Image)"
        >
          📎
        </button>

        {isRecording ? (
          <div
            style={{
              flex: 1,
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🔴 ಧ್ವನಿ ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ... 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}</span>
            <span style={{ fontSize: '11px', color: '#991b1b' }}>ನಿಲ್ಲಿಸಲು ಮೈಕ್ ಒತ್ತಿ</span>
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} style={{ flex: 1, display: 'flex' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ಕನ್ನಡದಲ್ಲಿ ಸಂದೇಶ ಅಥವಾ RD ನಂಬರ್ ಬರೆಯಿರಿ..."
              style={{
                width: '100%',
                padding: '9px 16px',
                borderRadius: '20px',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                backgroundColor: '#ffffff',
              }}
            />
          </form>
        )}

        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: isRecording ? '#dc2626' : '#075e54',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
            transition: 'background-color 0.2s',
          }}
          title={isRecording ? 'Stop Recording' : 'Hold / Tap to Record Kannada Voice'}
        >
          {isRecording ? '⏹' : '🎤'}
        </button>
      </div>
    </div>
  );
};
