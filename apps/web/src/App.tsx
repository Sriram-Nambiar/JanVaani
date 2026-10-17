import { useState } from 'react';
import { WhatsAppChat } from './components/WhatsAppChat';
import { InspectorPanel } from './components/InspectorPanel';
import { MockSevaSindhu } from './components/MockSevaSindhu';
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

  const [activeTab, setActiveTab] = useState<'both' | 'chat' | 'rightPane'>('both');
  const [rightPanelView, setRightPanelView] = useState<'inspector' | 'sevasindhu'>('inspector');

  const [agentData, setAgentData] = useState<any>(null);
  const [isAgentActive, setIsAgentActive] = useState(false);

  const handleEngineUpdate = (data: WhatsAppApiResponse) => {
    setEngineState({
      activeFeature: data.feature,
      transcript: data.transcript,
      formDraft: data.formDraft,
      auditResult: data.auditResult,
      statusRecord: data.statusRecord,
      isMock: data.isMock,
    });

    if (data.formDraft?.schemeId === 'gruha_jyothi') {
      setAgentData({
        schemeId: 'gruha_jyothi',
        applicantName: data.formDraft.extractedFields.applicantName,
        consumerId: data.formDraft.extractedFields.consumerId,
        escomName: data.formDraft.extractedFields.escomName,
        aadhaarNumber: data.formDraft.extractedFields.aadhaarNumber,
        occupancyType: data.formDraft.extractedFields.occupancyType,
      });

      if (data.formDraft.isComplete) {
        setIsAgentActive(true);
        setRightPanelView('sevasindhu');
      }
    }
  };

  const handleDispatchAgent = (data: any) => {
    setAgentData(data);
    setIsAgentActive(true);
    setRightPanelView('sevasindhu');
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
              Voice-First Civic Copilot • Seva Sindhu Autonomous Agent
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Switch Right Pane: Inspector vs Mock Seva Sindhu */}
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
              onClick={() => setRightPanelView('inspector')}
              style={{
                background: rightPanelView === 'inspector' ? '#0f172a' : 'transparent',
                color: rightPanelView === 'inspector' ? '#38bdf8' : '#94a3b8',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              📋 Copilot Inspector
            </button>
            <button
              onClick={() => setRightPanelView('sevasindhu')}
              style={{
                background: rightPanelView === 'sevasindhu' ? '#800000' : 'transparent',
                color: rightPanelView === 'sevasindhu' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🏛️ Mock Seva Sindhu Portal
            </button>
          </div>

          {/* Tab View Selector (Split / Full) */}
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
              onClick={() => setActiveTab('rightPane')}
              style={{
                background: activeTab === 'rightPane' ? '#0f172a' : 'transparent',
                color: activeTab === 'rightPane' ? '#25d366' : '#94a3b8',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {rightPanelView === 'sevasindhu' ? 'Seva Sindhu' : 'Inspector'}
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
        {activeTab !== 'rightPane' && (
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
            <WhatsAppChat
              onEngineUpdate={handleEngineUpdate}
              onDispatchAgent={handleDispatchAgent}
            />
          </div>
        )}

        {/* Right Pane: Inspector OR Mock Seva Sindhu Portal */}
        {activeTab !== 'chat' && (
          <div
            style={{
              flex: 1,
              height: '100%',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
          >
            {rightPanelView === 'sevasindhu' ? (
              <MockSevaSindhu
                agentData={agentData}
                isAgentActive={isAgentActive}
                onSubmissionComplete={(_ack, res) => {
                  setEngineState((prev) => ({
                    ...prev,
                    statusRecord: res.statusRecord,
                  }));
                }}
              />
            ) : (
              <InspectorPanel
                activeFeature={engineState.activeFeature}
                transcript={engineState.transcript}
                formDraft={engineState.formDraft}
                auditResult={engineState.auditResult}
                statusRecord={engineState.statusRecord}
                isMock={engineState.isMock}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
