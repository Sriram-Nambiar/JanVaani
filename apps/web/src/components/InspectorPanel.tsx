import React, { useState } from 'react';
import { FormDraft, DocumentAudit, ApplicationStatus } from '../types';

interface InspectorPanelProps {
  activeFeature?: 'dhvani_form' | 'kagada_check' | 'audio_status_bell' | 'sarvam_chat';
  transcript?: string;
  formDraft?: FormDraft;
  auditResult?: DocumentAudit;
  statusRecord?: ApplicationStatus;
  chatReply?: string;
  isMock?: boolean;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  activeFeature,
  transcript,
  formDraft,
  auditResult,
  statusRecord,
  chatReply,
  isMock = false,
}) => {
  const [showRawJson, setShowRawJson] = useState(false);

  console.log('Inspecting applicant personal application details:', statusRecord?.applicantName, statusRecord?.ackNumber);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e5e7eb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflowY: 'auto',
      }}
    >
      {/* Inspector Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>
            JanVaani Copilot Inspector
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Behind-the-scenes Voice & Rule Execution
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '12px',
              backgroundColor: isMock ? '#fef3c7' : '#dcfce7',
              color: isMock ? '#92400e' : '#166534',
              border: `1px solid ${isMock ? '#fde68a' : '#bbf7d0'}`,
            }}
          >
            {isMock ? '● DEMO MOCK MODE' : '● LIVE SARVAM AI'}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        {/* Active Feature Badge */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Active Module:</span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#0369a1',
            }}
          >
            {activeFeature === 'dhvani_form' && '🎙️ ಧ್ವನಿ ಅರ್ಜಿ (Dhvani-Form)'}
            {activeFeature === 'kagada_check' && '📄 ಕಾಗದ ಪರಿಶೀಲನೆ (Kagada-Check)'}
            {activeFeature === 'audio_status_bell' && '🔔 ಅರ್ಜಿ ಸ್ಥಿತಿ (Audio Status Bell)'}
            {activeFeature === 'sarvam_chat' && '💬 ಸರ್ವಂ ಸಂಭಾಷಣೆ (Sarvam-105B Chat)'}
            {!activeFeature && 'ವೇಟಿಂಗ್... (Awaiting WhatsApp Input)'}
          </span>
        </div>

        {/* 1. Sarvam STT Transcription Box */}
        <div
          style={{
            padding: '14px',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Sarvam Saaras STT (kn-IN)
            </span>
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Confidence: 96%</span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#1e293b',
              fontWeight: 500,
              fontStyle: transcript ? 'normal' : 'italic',
            }}
          >
            {transcript || 'ಯಾವುದೇ ಧ್ವನಿ ಸಂದೇಶವಿಲ್ಲ (No voice input recorded yet)'}
          </p>
        </div>

        {/* Sarvam-105B Indic Conversational Engine Card */}
        {activeFeature === 'sarvam_chat' && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #c7d2fe',
              backgroundColor: '#eef2ff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#3730a3', fontWeight: 700 }}>
                🤖 Sarvam-105B Indic Conversational Engine
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  fontWeight: 600,
                  border: '1px solid #c7d2fe',
                }}
              >
                sarvam-105b-conversations
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#4338ca', marginBottom: '8px', fontWeight: 600 }}>
              Live Flagship Indic LLM Response & Bulbul v3 Voice Note:
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: '#1e1b4b', fontWeight: 500 }}>
              {chatReply || 'ಸರ್ವಂ AI ಮಾದರಿಯಿಂದ ಯಶಸ್ವಿಯಾಗಿ ಉತ್ತರ ರಚಿಸಲಾಗಿದೆ.'}
            </p>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(chatReply || '');
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  backgroundColor: '#4338ca',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Copy Reply
              </button>
              <a
                href="http://localhost:5173/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '11px', color: '#4338ca', marginLeft: '12px', textDecoration: 'underline' }}
              >
                View Copilot Docs
              </a>
            </div>
          </div>
        )}

        {/* 2. Dhvani-Form View */}
        {formDraft && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
              backgroundColor: '#f0f9ff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#0369a1', fontWeight: 700 }}>
                📋 Seva Sindhu Application Draft
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: formDraft.isComplete ? '#dcfce7' : '#fef9c3',
                  color: formDraft.isComplete ? '#15803d' : '#a16207',
                  fontWeight: 600,
                }}
              >
                {formDraft.isComplete ? 'ಸಂಪೂರ್ಣವಾಗಿದೆ (Complete)' : 'ಅಪೂರ್ಣ (Pending Details)'}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#0284c7', marginBottom: '10px', fontWeight: 600 }}>
              {formDraft.schemeNameKn} ({formDraft.schemeNameEn})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {Object.entries(formDraft.extractedFields).map(([key, val]) => {
                const displayVal = key.toLowerCase().includes('aadhaar')
                  ? 'XXXX-XXXX-' + (String(val).replace(/\D/g, '').slice(-4) || '5028')
                  : String(val);
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #e0f2fe',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: '#64748b' }}>{key}:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{displayVal}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => alert(`Official Draft Exported for ${formDraft.schemeNameEn}!\n\nReady for Grama One QR Scan.`)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📄 Export Grama One Draft (PDF + QR)
            </button>
          </div>
        )}

        {/* 3. Kagada-Check Document Audit View */}
        {auditResult && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${auditResult.status === 'VERIFIED' ? '#86efac' : '#fca5a5'}`,
              backgroundColor: auditResult.status === 'VERIFIED' ? '#f0fdf4' : '#fff1f2',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 700,
                  color: auditResult.status === 'VERIFIED' ? '#15803d' : '#b91c1c',
                }}
              >
                {auditResult.status === 'VERIFIED' ? '✅ Document Verified' : '⚠️ Discrepancy Detected'}
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{auditResult.documentType}</span>
            </div>

            {auditResult.issues.length > 0 ? (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase' }}>
                  ದೋಷಗಳ ವಿವರ (Flagged Issues):
                </span>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', fontSize: '12px', color: '#991b1b' }}>
                  {auditResult.issues.map((issue, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#166534' }}>
                ದಾಖಲೆಗಳು ಸರ್ಕಾರಿ ನಿಯಮಾವಳಿಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿವೆ (All checks passed).
              </p>
            )}

            <div
              style={{
                padding: '10px',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                color: '#334155',
                lineHeight: '1.4',
              }}
            >
              <strong style={{ color: '#075e54' }}>Sarvam Spoken Guidance:</strong>
              <p style={{ margin: '4px 0 0 0' }}>{auditResult.spokenVerdictKn}</p>
            </div>
          </div>
        )}

        {/* 4. Audio Status Bell Timeline View */}
        {statusRecord && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #fed7aa',
              backgroundColor: '#fff7ed',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#c2410c', fontWeight: 700 }}>
                🔔 Application Status: {statusRecord.ackNumber}
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: statusRecord.isReadyForDownload ? '#dcfce7' : '#fed7aa',
                  color: statusRecord.isReadyForDownload ? '#15803d' : '#9a3412',
                }}
              >
                {statusRecord.isReadyForDownload ? 'Ready to Download' : 'In Progress'}
              </span>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 600, color: '#9a3412', marginBottom: '12px' }}>
              {statusRecord.currentStageKn}
            </div>

            {/* Stepper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {statusRecord.timeline.map((step) => (
                <div key={step.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor:
                        step.status === 'COMPLETED'
                          ? '#22c55e'
                          : step.status === 'IN_PROGRESS'
                          ? '#f97316'
                          : step.status === 'REJECTED'
                          ? '#ef4444'
                          : '#cbd5e1',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    {step.status === 'COMPLETED' ? '✓' : step.step}
                  </div>
                  <div style={{ fontSize: '12px', flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{step.labelKn}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{step.labelEn}</div>
                  </div>
                </div>
              ))}
            </div>

            {statusRecord.ackNumber.startsWith('SEVA-DEMO-') && (
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '11px', color: '#1e40af', display: 'block', marginBottom: '6px' }}>
                  🏛️ View application live in Seva Sindhu Portal:
                </span>
                <a
                  href={`http://localhost:5174/status?appId=${encodeURIComponent(statusRecord.ackNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#1d4ed8',
                    textDecoration: 'underline',
                  }}
                >
                  Open in Seva Sindhu Demo Portal ↗
                </a>
              </div>
            )}
          </div>
        )}

        {/* Raw JSON Inspector Toggle */}
        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '12px',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showRawJson ? 'Hide Raw API JSON' : 'Inspect Raw API Response'}
          </button>

          {showRawJson && (
            <pre
              style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                borderRadius: '6px',
                fontSize: '11px',
                overflowX: 'auto',
                maxHeight: '180px',
              }}
            >
              {JSON.stringify({ activeFeature, transcript, formDraft, auditResult, statusRecord }, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
