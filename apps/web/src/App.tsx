import { useState } from 'react';
import { WhatsAppChat } from './components/WhatsAppChat';
import { InspectorPanel } from './components/InspectorPanel';
import { WhatsAppApiResponse } from './types';

export function App() {
  const [engineState, setEngineState] = useState<{
    activeFeature?: 'dhvani_form' | 'kagada_check' | 'audio_status_bell';
    transcript?: string;
    formDraft?: any;
    auditResult?: any;
    statusRecord?: any;
    isMock?: boolean;
  }>({
    isMock: true,
  });

  const [activeTab, setActiveTab] = useState<'both' | 'chat' | 'inspector'>('both');

  const handleEngineUpdate = (data: WhatsAppApiResponse) => {
    setEngineState({
      activeFeature: data.feature,
      transcript: data.transcript,
      formDraft: data.formDraft,
      auditResult: data.auditResult,
      statusRecord: data.statusRecord,
      isMock: data.isMock,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Global Bar */}
      <header
        style={{
          height: '56px',
          backgroundColor: '#0b132b',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          color: '#ffffff',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#128c7e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '18px',
            }}
          >
            ಜ
          </div>
          <div>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              JanVaani <span style={{ color: '#25d366', fontWeight: 500 }}>(ಜನವಾಣಿ)</span>
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '12px' }}>
              Voice-First Civic Copilot • Karnataka Services
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#1e293b',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setActiveTab('both')}
              style={{
                background: activeTab === 'both' ? '#0f172a' : 'transparent',
                color: activeTab === 'both' ? '#25d366' : '#94a3b8',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                background: activeTab === 'chat' ? '#0f172a' : 'transparent',
                color: activeTab === 'chat' ? '#25d366' : '#94a3b8',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              style={{
                background: activeTab === 'inspector' ? '#0f172a' : 'transparent',
                color: activeTab === 'inspector' ? '#25d366' : '#94a3b8',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Inspector
            </button>
          </div>

          <span
            style={{
              fontSize: '11px',
              backgroundColor: 'rgba(37, 211, 102, 0.15)',
              color: '#25d366',
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: 600,
              border: '1px solid rgba(37, 211, 102, 0.3)',
            }}
          >
            Sarvam AI (Saaras + Bulbul)
          </span>

          <span
            style={{
              fontSize: '11px',
              backgroundColor: engineState.isMock ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              color: engineState.isMock ? '#eab308' : '#22c55e',
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: 600,
            }}
          >
            {engineState.isMock ? 'DEMO MOCK ENGINE' : 'LIVE SARVAM KEY'}
          </span>
        </div>
      </header>

      {/* Main Dual-Pane Body */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          backgroundColor: '#0f172a',
        }}
      >
        {/* Left Pane: WhatsApp Phone Frame */}
        {activeTab !== 'inspector' && (
          <div
            style={{
              width: activeTab === 'chat' ? '100%' : '460px',
              minWidth: activeTab === 'chat' ? '100%' : '400px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid #1e293b',
              backgroundColor: '#ffffff',
            }}
          >
            <WhatsAppChat onEngineUpdate={handleEngineUpdate} />
          </div>
        )}

        {/* Right Pane: Live Copilot Engine Inspector */}
        {activeTab !== 'chat' && (
          <div
            style={{
              flex: 1,
              height: '100%',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
          >
            <InspectorPanel
              activeFeature={engineState.activeFeature}
              transcript={engineState.transcript}
              formDraft={engineState.formDraft}
              auditResult={engineState.auditResult}
              statusRecord={engineState.statusRecord}
              isMock={engineState.isMock}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
