import { useState } from 'react';
import { WhatsAppChat } from './components/WhatsAppChat';
import { InspectorPanel } from './components/InspectorPanel';
import { DraftViewerModal } from './components/DraftViewerModal';
import { OfficerPushSimulator } from './components/OfficerPushSimulator';
import { MockServersSite } from './mock-servers/MockServersSite';
import { JanVaaniDashboard } from './components/dashboard/JanVaaniDashboard';
import { WhatsAppApiResponse, ChatMessage } from './types';

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

  // Main View Mode: 'dashboard' (Voice Civic Dashboard) vs 'copilot' (WhatsApp + Inspector) vs 'mock_servers'
  const [viewMode, setViewMode] = useState<'dashboard' | 'copilot' | 'mock_servers'>('dashboard');

  // Copilot Layout Mode: 'both' | 'chat' | 'inspector'
  const [activeTab, setActiveTab] = useState<'both' | 'chat' | 'inspector'>('both');

  const [agentData, setAgentData] = useState<any>(null);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [draftModalAck, setDraftModalAck] = useState<string | null>(null);
  const [pushedMessage, setPushedMessage] = useState<ChatMessage | null>(null);
  const [lastAck, setLastAck] = useState<string>('RD002');

  const handleEngineUpdate = (data: WhatsAppApiResponse) => {
    setEngineState({
      activeFeature: data.feature,
      transcript: data.transcript,
      formDraft: data.formDraft,
      auditResult: data.auditResult,
      statusRecord: data.statusRecord,
      isMock: data.isMock,
    });

    if (data.formDraft?.schemeId) {
      setAgentData({
        schemeId: data.formDraft.schemeId,
        ...data.formDraft.extractedFields,
      });

      if (data.formDraft.isComplete) {
        setIsAgentActive(true);
      }
    }
  };

  const handleDispatchAgent = () => {
    if (engineState.formDraft) {
      setAgentData({
        schemeId: engineState.formDraft.schemeId,
        ...engineState.formDraft.extractedFields,
      });
      setIsAgentActive(true);
      // Optional: switch to mock servers site so user can see it auto-filled
      setViewMode('mock_servers');
    }
  };

  if (viewMode === 'dashboard') {
    return (
      <JanVaaniDashboard
        onSwitchToCopilot={() => setViewMode('copilot')}
        onSwitchToMockServers={() => setViewMode('mock_servers')}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Minimal, Sleek Header */}
      <header
        style={{
          height: '56px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid #1e293b',
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#25d366',
              color: '#0f172a',
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
              Voice-First Civic Copilot for Karnataka Public Services
            </span>
          </div>
        </div>

        {/* Minimal Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Main View Switcher: Copilot vs Mock Servers Site */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid #334155',
            }}
          >
            <button
              onClick={() => setViewMode('dashboard')}
              style={{
                background: '#065f46',
                color: '#86efac',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🎙️</span> JanVaani Dashboard (ಮುಖಪುಟ)
            </button>
            <button
              onClick={() => setViewMode('copilot')}
              style={{
                background: viewMode === 'copilot' ? '#0f172a' : 'transparent',
                color: viewMode === 'copilot' ? '#38bdf8' : '#94a3b8',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>💬</span> WhatsApp Copilot & Inspector
            </button>
            <button
              onClick={() => setViewMode('mock_servers')}
              style={{
                background: viewMode === 'mock_servers' ? '#991b1b' : 'transparent',
                color: viewMode === 'mock_servers' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🏛️</span> Mock Government Servers (ಸರ್ಕಾರಿ ಸೇವೆಗಳು)
            </button>
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#1e3a8a',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid #3b82f6',
              }}
            >
              <span>🌐</span> Seva Sindhu Portal (Port 5174) ↗
            </a>
          </div>

          {/* Layout Switcher (when in Copilot view) */}
          {viewMode === 'copilot' && (
            <div
              style={{
                display: 'flex',
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                padding: '2px',
                border: '1px solid #334155',
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
                WhatsApp Only
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
                Inspector Only
              </button>
            </div>
          )}

          {/* Sarvam AI Badge */}
          <span
            style={{
              fontSize: '11px',
              backgroundColor: 'rgba(37, 211, 102, 0.15)',
              color: '#25d366',
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: 600,
              border: '1px solid rgba(37, 211, 102, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#25d366' }} />
            Sarvam AI (Saaras + Bulbul)
          </span>
        </div>
      </header>

      {/* Main Body */}
      {viewMode === 'copilot' ? (
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
                width: activeTab === 'chat' ? '100%' : '480px',
                minWidth: activeTab === 'chat' ? '100%' : '420px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #1e293b',
                backgroundColor: '#ffffff',
              }}
            >
              <WhatsAppChat
                onEngineUpdate={handleEngineUpdate}
                onDispatchAgent={handleDispatchAgent}
                onOpenDraftModal={(ack) => setDraftModalAck(ack)}
                onOpenGrievanceModal={() => setViewMode('mock_servers')}
                pushedMessage={pushedMessage}
              />
            </div>
          )}

          {/* Right Pane: Inspector ONLY */}
          {activeTab !== 'chat' && (
            <div
              style={{
                flex: 1,
                height: '100%',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <InspectorPanel
                  activeFeature={engineState.activeFeature}
                  transcript={engineState.transcript}
                  formDraft={engineState.formDraft}
                  auditResult={engineState.auditResult}
                  statusRecord={engineState.statusRecord}
                  isMock={engineState.isMock}
                />
              </div>
              <div
                style={{
                  borderTop: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  padding: '0 16px 16px 16px',
                }}
              >
                <OfficerPushSimulator
                  currentAckNumber={lastAck}
                  onPushDispatched={(pushData) => {
                    setEngineState((prev) => ({
                      ...prev,
                      statusRecord: pushData.updatedRecord,
                      activeFeature: 'audio_status_bell',
                    }));
                    setPushedMessage({
                      id: `push-${Date.now()}`,
                      sender: 'janvaani',
                      type: 'voice',
                      text: `🔔 [ಅಧಿಕಾರಿ ಅಪ್‌ಡೇಟ್ - ${pushData.stage}]: ${pushData.spokenNotificationKn}`,
                      audioBase64: pushData.audioBase64,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    });
                  }}
                />
              </div>
            </div>
          )}
        </main>
      ) : (
        /* Mock Government Servers Site */
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <MockServersSite
            agentData={agentData}
            isAgentActive={isAgentActive}
            onSubmissionComplete={(ack, res) => {
              setLastAck(ack);
              setEngineState((prev) => ({
                ...prev,
                statusRecord: res.statusRecord,
              }));
            }}
            onBackToCopilot={() => setViewMode('copilot')}
          />
        </main>
      )}

      {/* Application Draft Document Viewer Modal */}
      <DraftViewerModal
        ackNumber={draftModalAck || ''}
        isOpen={Boolean(draftModalAck)}
        onClose={() => setDraftModalAck(null)}
      />
    </div>
  );
}

export default App;
