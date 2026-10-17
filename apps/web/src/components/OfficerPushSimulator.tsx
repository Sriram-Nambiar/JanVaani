import React, { useState } from 'react';

interface OfficerPushSimulatorProps {
  currentAckNumber?: string;
  onPushDispatched?: (pushData: {
    ackNumber: string;
    stage: string;
    spokenNotificationKn: string;
    audioBase64: string;
    updatedRecord: any;
  }) => void;
}

export const OfficerPushSimulator: React.FC<OfficerPushSimulatorProps> = ({
  currentAckNumber = 'RD002',
  onPushDispatched,
}) => {
  const [selectedAck, setSelectedAck] = useState(currentAckNumber);
  const [stage, setStage] = useState<'APPROVED' | 'RESUBMIT_REQUIRED' | 'DISPATCHED' | 'FIELD_VERIFICATION'>('APPROVED');
  const [isDispatching, setIsDispatching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Keep selectedAck updated if a new application was submitted in Seva Sindhu
  React.useEffect(() => {
    if (currentAckNumber) {
      setSelectedAck(currentAckNumber);
    }
  }, [currentAckNumber]);

  const handleSimulatePush = async () => {
    setIsDispatching(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/whatsapp/status/simulate-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'janvaani_demo_secret',
          'x-janvaani-role': 'officer-simulator',
        },
        body: JSON.stringify({
          ackNumber: selectedAck,
          stage,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to simulate push: HTTP ${res.status}`);
      }

      const json = await res.json();
      setStatusMessage(`✅ ಧ್ವನಿ ಸಂದೇಶ ರವಾನೆಯಾಗಿದೆ! (Voice push alert sent for ${selectedAck})`);

      if (onPushDispatched) {
        onPushDispatched({
          ackNumber: selectedAck,
          stage,
          spokenNotificationKn: json.spokenNotificationKn,
          audioBase64: json.audioBase64,
          updatedRecord: json.updatedRecord,
        });
      }
    } catch (err: any) {
      setStatusMessage(`❌ Error: ${err.message || 'Push failed'}`);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '14px',
        marginTop: '16px',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🏛️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              ಅಧಿಕಾರಿ ಪುಶ್ ನೋಟಿಫಿಕೇಶನ್ ಸಿಮ್ಯುಲೇಟರ್ (Officer Status Push)
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Simulate Tahsildar / ESCOM RI stage update pushing a real-time WhatsApp audio alert
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: '#f1f5f9',
            color: '#475569',
            padding: '2px 8px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
          }}
        >
          DEMO FEED
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
            ಅರ್ಜಿ ಸಂಖ್ಯೆ (Acknowledgment):
          </label>
          <input
            type="text"
            value={selectedAck}
            onChange={(e) => setSelectedAck(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              border: '1px solid #94a3b8',
              borderRadius: '4px',
              boxSizing: 'border-box',
              fontFamily: 'monospace',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
            ಹೊಸ ಸ್ಥಿತಿ (New Officer Stage):
          </label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as any)}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              border: '1px solid #94a3b8',
              borderRadius: '4px',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
            }}
          >
            <option value="APPROVED">ಅನುಮೋದನೆ (Tahsildar Approved)</option>
            <option value="DISPATCHED">ವಿತರಣೆ (Certificate Dispatched)</option>
            <option value="RESUBMIT_REQUIRED">ದಾಖಲೆ ಮರುಸಲ್ಲಿಕೆ (Action Required)</option>
            <option value="FIELD_VERIFICATION">ಸ್ಥಳ ಪರಿಶೀಲನೆ (RI Verification)</option>
          </select>
        </div>

        <div style={{ alignSelf: 'flex-end' }}>
          <button
            onClick={handleSimulatePush}
            disabled={isDispatching || !selectedAck}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: isDispatching ? '#94a3b8' : '#047857',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: isDispatching ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isDispatching ? 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...' : '🔔 Push Voice Alert'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            color: statusMessage.startsWith('✅') ? '#047857' : '#b91c1c',
            fontWeight: 600,
          }}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
};
