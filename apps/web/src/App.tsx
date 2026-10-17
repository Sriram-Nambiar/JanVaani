import { useState } from 'react';
import { WhatsAppChat } from './components/WhatsAppChat';
import { InspectorPanel } from './components/InspectorPanel';
import { MockSevaSindhu } from './components/MockSevaSindhu';
import { DraftViewerModal } from './components/DraftViewerModal';
import { OfficerPushSimulator } from './components/OfficerPushSimulator';
import { DocumentAuditModal } from './components/DocumentAuditModal';
import { JanaSpandanaModal } from './components/JanaSpandanaModal';
import { GramaOneKioskModal } from './components/GramaOneKioskModal';
import { QRVerificationModal } from './components/QRVerificationModal';
import { MeterSubsidyModal } from './components/MeterSubsidyModal';
import { YuvaNidhiModal } from './components/YuvaNidhiModal';
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

  const [activeTab, setActiveTab] = useState<'both' | 'chat' | 'rightPane'>('both');
  const [rightPanelView, setRightPanelView] = useState<'inspector' | 'sevasindhu'>('inspector');

  const [agentData, setAgentData] = useState<any>(null);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [draftModalAck, setDraftModalAck] = useState<string | null>(null);
  const [pushedMessage, setPushedMessage] = useState<ChatMessage | null>(null);
  const [lastAck, setLastAck] = useState<string>('RD002');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [isYuvaModalOpen, setIsYuvaModalOpen] = useState(false);

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

          {/* Kagada-Check Auditor Trigger */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            style={{
              backgroundColor: '#065f46',
              color: '#d1fae5',
              border: '1px solid #047857',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔍</span> Kagada-Check (ಕಾಗದ ಪರಿಶೀಲನೆ)
          </button>

          {/* JanaSpandana Public Grievance Redressal Trigger */}
          <button
            onClick={() => setIsGrievanceModalOpen(true)}
            style={{
              backgroundColor: '#b45309',
              color: '#fef3c7',
              border: '1px solid #d97706',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🏛️</span> ಜನಸ್ಪಂದನ 1902 (Grievance)
          </button>

          {/* Grama One Rural Citizen Kiosk */}
          <button
            onClick={() => setIsKioskModalOpen(true)}
            style={{
              backgroundColor: '#065f46',
              color: '#d1fae5',
              border: '1px solid #059669',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🏪</span> ಗ್ರಾಮ ಒನ್ (Grama One Kiosk)
          </button>

          {/* Official QR Verification Modal Trigger */}
          <button
            onClick={() => setIsQRModalOpen(true)}
            style={{
              backgroundColor: '#1e1b4b',
              color: '#c7d2fe',
              border: '1px solid #4338ca',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🛡️</span> QR ಪರಿಶೀಲನೆ (QR Verify)
          </button>

          {/* Gruha Jyothi Meter Subsidy Modal Trigger */}
          <button
            onClick={() => setIsMeterModalOpen(true)}
            style={{
              backgroundColor: '#78350f',
              color: '#fef3c7',
              border: '1px solid #b45309',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⚡</span> ಮೀಟರ್ ಲೆಕ್ಕಾಚಾರ (Meter Subsidy)
          </button>

          {/* Yuva Nidhi Allowance Modal Trigger */}
          <button
            onClick={() => setIsYuvaModalOpen(true)}
            style={{
              backgroundColor: '#1e3a8a',
              color: '#dbeafe',
              border: '1px solid #2563eb',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🎓</span> ಯುವನಿಧಿ (Yuva Nidhi)
          </button>

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
              onOpenDraftModal={(ack) => setDraftModalAck(ack)}
              onOpenGrievanceModal={() => setIsGrievanceModalOpen(true)}
              pushedMessage={pushedMessage}
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
                onSubmissionComplete={(ack, res) => {
                  setLastAck(ack);
                  setEngineState((prev) => ({
                    ...prev,
                    statusRecord: res.statusRecord,
                  }));
                }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                <div style={{ borderTop: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '0 16px 16px 16px' }}>
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
          </div>
        )}
      </main>

      {/* Application Draft Document Viewer Modal */}
      <DraftViewerModal
        ackNumber={draftModalAck || ''}
        isOpen={Boolean(draftModalAck)}
        onClose={() => setDraftModalAck(null)}
      />

      {/* Kagada-Check Document Auditor Modal */}
      <DocumentAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onProceedWithDraft={() => {
          setAgentData((prev: any) => ({
            ...prev,
            schemeId: 'gruha_lakshmi',
            applicantName: 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)',
          }));
          setRightPanelView('sevasindhu');
        }}
      />

      {/* JanaSpandana 1902 Public Grievance Redressal Modal */}
      <JanaSpandanaModal
        isOpen={isGrievanceModalOpen}
        onClose={() => setIsGrievanceModalOpen(false)}
        prefillAckNumber={lastAck}
      />

      {/* Grama One Rural Citizen Service Kiosk Modal */}
      <GramaOneKioskModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
      />

      {/* Official Certificate QR Verification Modal */}
      <QRVerificationModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        prefillAckNumber={lastAck}
      />

      {/* Gruha Jyothi 200-Unit Meter Subsidy Modal */}
      <MeterSubsidyModal
        isOpen={isMeterModalOpen}
        onClose={() => setIsMeterModalOpen(false)}
      />

      {/* Karnataka Yuva Nidhi Allowance Modal */}
      <YuvaNidhiModal
        isOpen={isYuvaModalOpen}
        onClose={() => setIsYuvaModalOpen(false)}
      />
    </div>
  );
}

export default App;
