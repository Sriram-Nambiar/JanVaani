import React, { useState, useEffect, useRef } from 'react';

interface MockSevaSindhuProps {
  agentData?: {
    applicantName?: string;
    consumerId?: string;
    escomName?: string;
    aadhaarNumber?: string;
    occupancyType?: string;
  };
  isAgentActive?: boolean;
  onSubmissionComplete?: (ackNumber: string, data: any) => void;
}

export const MockSevaSindhu: React.FC<MockSevaSindhuProps> = ({
  agentData,
  isAgentActive = false,
  onSubmissionComplete,
}) => {
  const [escom, setEscom] = useState('BESCOM');
  const [consumerId, setConsumerId] = useState('');
  const [name, setName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [occupancy, setOccupancy] = useState('Tenant');
  const [declaration, setDeclaration] = useState(false);

  const [agentStep, setAgentStep] = useState<'idle' | 'typing' | 'submitting' | 'submitted' | 'error'>('idle');
  const [ackReceipt, setAckReceipt] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stable callback ref to prevent unneeded effect re-runs
  const onSubmissionCompleteRef = useRef(onSubmissionComplete);
  useEffect(() => {
    onSubmissionCompleteRef.current = onSubmissionComplete;
  }, [onSubmissionComplete]);

  // Timers and auto-fill lifecycle tracking
  const isAutoFillingRef = useRef(false);
  const timer1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timer1Ref.current) {
      clearTimeout(timer1Ref.current);
      timer1Ref.current = null;
    }
    if (timer2Ref.current) {
      clearTimeout(timer2Ref.current);
      timer2Ref.current = null;
    }
    isAutoFillingRef.current = false;
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // Sync with incoming WhatsApp Agent data
  useEffect(() => {
    if (agentData) {
      if (agentData.escomName) {
        const raw = agentData.escomName.toUpperCase();
        const validEscoms = ['BESCOM', 'HESCOM', 'GESCOM', 'MESCOM', 'CESC'] as const;
        const matched = validEscoms.find((e) => raw.includes(e));
        if (matched) {
          setEscom(matched);
        }
      }
      if (agentData.consumerId) {
        setConsumerId(agentData.consumerId);
      }
      if (agentData.applicantName) {
        setName(agentData.applicantName);
      }
      if (agentData.aadhaarNumber) {
        setAadhaar(agentData.aadhaarNumber);
      }
      if (agentData.occupancyType) {
        setOccupancy(agentData.occupancyType.includes('Tenant') ? 'Tenant' : 'Owner');
      }
      setDeclaration(true);
    }
  }, [agentData]);

  const executeSubmission = async (payload: { applicantName: string; consumerId: string; escomName: string }) => {
    setAgentStep('submitting');
    setErrorMessage(null);
    try {
      const res = await fetch('/api/whatsapp/agent/submit-seva-sindhu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: 'gruha_jyothi',
          fields: {
            applicantName: payload.applicantName,
            consumerId: payload.consumerId,
            escomName: payload.escomName,
          },
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.error?.message || `Seva Sindhu portal returned HTTP ${res.status}`);
      }

      const json = await res.json();
      setAckReceipt(json);
      setAgentStep('submitted');
      if (onSubmissionCompleteRef.current) {
        onSubmissionCompleteRef.current(json.acknowledgmentNumber, json);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'ಸೇವಾ ಸಿಂಧು ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ / Server connection failed. Application could not be submitted.');
      setAgentStep('error');
    } finally {
      isAutoFillingRef.current = false;
    }
  };

  const executeSubmissionRef = useRef(executeSubmission);
  useEffect(() => {
    executeSubmissionRef.current = executeSubmission;
  });

  // Handle agent auto-fill animation
  useEffect(() => {
    if (isAgentActive && !isAutoFillingRef.current && agentStep === 'idle') {
      clearTimers();
      isAutoFillingRef.current = true;
      setAgentStep('typing');

      const raw = (agentData?.escomName || '').toUpperCase();
      const validEscoms = ['BESCOM', 'HESCOM', 'GESCOM', 'MESCOM', 'CESC'] as const;
      const escomVal = validEscoms.find((e) => raw.includes(e)) || 'BESCOM';
      const applicantName = agentData?.applicantName || 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)';
      const consumer = agentData?.consumerId || '1029384756';

      timer1Ref.current = setTimeout(() => {
        setEscom(escomVal);
        setName(applicantName);
        setAadhaar(agentData?.aadhaarNumber || 'XXXX-XXXX-4821');
        setConsumerId(consumer);
        setOccupancy('Tenant');
        setDeclaration(true);

        timer2Ref.current = setTimeout(() => {
          executeSubmissionRef.current({
            applicantName,
            consumerId: consumer,
            escomName: escomVal,
          });
        }, 1200);
      }, 1000);

      return () => {
        clearTimers();
      };
    }
  }, [isAgentActive, agentStep, agentData]);

  const handleTriggerTestAgent = () => {
    clearTimers();
    isAutoFillingRef.current = true;
    setErrorMessage(null);
    setAckReceipt(null);
    setAgentStep('typing');

    const raw = (agentData?.escomName || '').toUpperCase();
    const validEscoms = ['BESCOM', 'HESCOM', 'GESCOM', 'MESCOM', 'CESC'] as const;
    const escomVal = validEscoms.find((e) => raw.includes(e)) || 'BESCOM';
    const applicantName = agentData?.applicantName || 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)';
    const consumer = agentData?.consumerId || '1029384756';

    timer1Ref.current = setTimeout(() => {
      setEscom(escomVal);
      setName(applicantName);
      setAadhaar(agentData?.aadhaarNumber || 'XXXX-XXXX-4821');
      setConsumerId(consumer);
      setOccupancy('Tenant');
      setDeclaration(true);

      timer2Ref.current = setTimeout(() => {
        executeSubmissionRef.current({
          applicantName,
          consumerId: consumer,
          escomName: escomVal,
        });
      }, 1200);
    }, 1000);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearTimers();
    await executeSubmission({
      applicantName: name || 'ಸವಿತಾ ಕುಮಾರಿ',
      consumerId: consumerId || '1029384756',
      escomName: escom,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#f3f4f6',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        overflowY: 'auto',
      }}
    >
      {/* Official Karnataka Government Seva Sindhu Header */}
      <div
        style={{
          backgroundColor: '#800000',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '4px solid #facc15',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#facc15',
              color: '#800000',
              fontWeight: 900,
              fontSize: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff',
            }}
          >
            ಕ
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.02em' }}>
              ಕರ್ನಾಟಕ ಸರ್ಕಾರ | Government of Karnataka
            </div>
            <div style={{ fontSize: '13px', color: '#fef08a' }}>
              ಸೇವಾ ಸಿಂಧು 2.0 (Seva Sindhu) • ಇಂಧನ ಇಲಾಖೆ (Department of Energy)
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <span style={{ color: '#fef08a', fontWeight: 600 }}>ಗೃಹ ಜ್ಯೋತಿ ಪೋರ್ಟಲ್</span>
          <div style={{ fontSize: '11px', color: '#f3f4f6' }}>Bescom • Mescom • Hescom • Gescom • C陽escom</div>
        </div>
      </div>

      {/* Autonomous Agent Status Banner */}
      <div
        style={{
          padding: '10px 24px',
          backgroundColor:
            agentStep === 'typing' || agentStep === 'submitting'
              ? '#fef08a'
              : agentStep === 'submitted'
              ? '#bbf7d0'
              : agentStep === 'error'
              ? '#fee2e2'
              : '#e0f2fe',
          borderBottom: '1px solid #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          fontWeight: 600,
          color:
            agentStep === 'typing' || agentStep === 'submitting'
              ? '#854d0e'
              : agentStep === 'submitted'
              ? '#166534'
              : agentStep === 'error'
              ? '#991b1b'
              : '#0369a1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>
            {agentStep === 'typing' && '🤖 JanVaani Voice Agent is automatically filling the Seva Sindhu form...'}
            {agentStep === 'submitting' && '⏳ Form-Filler Agent Submitting to Karnataka State Gateway...'}
            {agentStep === 'submitted' && '✅ Agent Execution Complete! Official Seva Sindhu Acknowledgment Generated.'}
            {agentStep === 'error' && '❌ Seva Sindhu Gateway Error • Submission Halted'}
            {agentStep === 'idle' && '🟢 Seva Sindhu Portal Ready • Awaiting WhatsApp Voice Agent Dispatch'}
          </span>
        </div>

        {agentStep !== 'submitted' && (
          <button
            onClick={handleTriggerTestAgent}
            disabled={agentStep === 'typing' || agentStep === 'submitting'}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              backgroundColor: '#800000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: agentStep === 'typing' || agentStep === 'submitting' ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: agentStep === 'typing' || agentStep === 'submitting' ? 0.6 : 1,
            }}
          >
            ⚡ Test Agent Auto-Fill
          </button>
        )}
      </div>

      {/* Form Content */}
      <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
        {agentStep === 'error' && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #f87171',
              color: '#991b1b',
              padding: '14px 18px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '14px' }}>
              ⚠️ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ವಿಫಲವಾಗಿದೆ (Submission Failed)
            </div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              {errorMessage || 'Unable to connect to Seva Sindhu gateway. Please verify connection and retry.'}
            </div>
            <button
              onClick={() => {
                clearTimers();
                setErrorMessage(null);
                setAgentStep('idle');
              }}
              style={{
                marginTop: '10px',
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#991b1b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ಮರುಪ್ರಯತ್ನಿಸಿ (Retry)
            </button>
          </div>
        )}

        {agentStep === 'submitted' && ackReceipt ? (
          /* Official Acknowledgment Receipt */
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '2px solid #16a34a',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  ಗೃಹ ಜ್ಯೋತಿ ಅರ್ಜಿ ಸ್ವೀಕೃತಿ ಪತ್ರ (Acknowledgment Receipt)
                </h3>
                <span style={{ fontSize: '12px' }}>Government of Karnataka • Seva Sindhu</span>
              </div>
              <span
                style={{
                  backgroundColor: '#ffffff',
                  color: '#16a34a',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                SUCCESS
              </span>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>Acknowledgment Number:</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#800000' }}>
                    {ackReceipt.acknowledgmentNumber}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>Submission Timestamp:</span>
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {new Date(ackReceipt.submittedAt || Date.now()).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>Applicant Name:</span>
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {ackReceipt.applicantName || 'ಸವಿತಾ ಕುಮಾರಿ'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>Electricity Account ID (RR No):</span>
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {ackReceipt.consumerId || '1029384756'} (BESCOM)
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0',
                  fontSize: '12px',
                  color: '#15803d',
                  lineHeight: '1.4',
                }}
              >
                <strong>ಸೇವಾ ಸಿಂಧು ದೃಢೀಕರಣ:</strong> ನಿಮ್ಮ ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಮುಂದಿನ ತಿಂಗಳ ಬಿಲ್‌ನಿಂದ 200 ಯೂನಿಟ್‌ವರೆಗೆ ಉಚಿತ ವಿದ್ಯುತ್ ಸೌಲಭ್ಯ ಜಾರಿಯಾಗಲಿದೆ.
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  QR Code / Digital Seal: Verified by JanVaani Autonomous Agent
                </div>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#800000',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  🖨️ Print Official Acknowledgment
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Live Seva Sindhu Form */
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ borderBottom: '2px solid #800000', paddingBottom: '10px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', color: '#800000', fontWeight: 700 }}>
                ಗೃಹ ಜ್ಯೋತಿ ಯೋಜನೆ ನೋಂದಣಿ ನಮೂನೆ (Gruha Jyothi Scheme Registration)
              </h2>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Under Energy Department, Government of Karnataka (Up to 200 units free)
              </span>
            </div>

            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  ವಿದ್ಯುತ್ ಸರಬರಾಜು ಕಂಪನಿ (ESCOM Name) *
                </label>
                <select
                  value={escom}
                  onChange={(e) => setEscom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                  }}
                >
                  <option value="BESCOM">BESCOM (Bangalore Electricity Supply Company)</option>
                  <option value="MESCOM">MESCOM (Mangalore Electricity Supply Company)</option>
                  <option value="HESCOM">HESCOM (Hubli Electricity Supply Company)</option>
                  <option value="GESCOM">GESCOM (Gulbarga Electricity Supply Company)</option>
                  <option value="CHESCOM">CHESCOM (Chamundeshwari Electricity Supply Corp)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  ಖಾತೆ ಸಂಖ್ಯೆ / Consumer ID (Account ID on Electricity Bill) *
                </label>
                <input
                  type="text"
                  value={consumerId}
                  onChange={(e) => setConsumerId(e.target.value)}
                  placeholder="e.g. 1029384756 (10 digit Account ID)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    ಅರ್ಜಿದಾರರ ಹೆಸರು (Name as per Aadhaar) *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Savitha Kumari"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '13px',
                      backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    ಆಧಾರ್ ಸಂಖ್ಯೆ (Aadhaar Number) *
                  </label>
                  <input
                    type="text"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    placeholder="XXXX-XXXX-4821"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '13px',
                      backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  ವಸ್ತುಸ್ಥಿತಿ (Occupancy Type) *
                </label>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#374151' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="occupancy"
                      value="Owner"
                      checked={occupancy === 'Owner'}
                      onChange={() => setOccupancy('Owner')}
                    />
                    ಮಾಲೀಕರು (Owner)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="occupancy"
                      value="Tenant"
                      checked={occupancy === 'Tenant'}
                      onChange={() => setOccupancy('Tenant')}
                    />
                    ಬಾಡಿಗೆದಾರರು (Tenant)
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#4b5563', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={declaration}
                    onChange={(e) => setDeclaration(e.target.checked)}
                    style={{ marginTop: '2px' }}
                    required
                  />
                  ನಾನು ಈ ಮೀಟರ್ ಸಂಪರ್ಕವನ್ನು ಕೇವಲ ಗೃಹಬಳಕೆಗೆ ಮಾತ್ರ ಉಪಯೋಗಿಸುತ್ತಿದ್ದೇನೆ ಎಂದು ಘೋಷಿಸುತ್ತೇನೆ. (Self Declaration)
                </label>
              </div>

              <button
                type="submit"
                disabled={agentStep === 'submitting'}
                style={{
                  marginTop: '12px',
                  padding: '10px 20px',
                  backgroundColor: '#800000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: agentStep === 'submitting' ? 'not-allowed' : 'pointer',
                  opacity: agentStep === 'submitting' ? 0.7 : 1,
                }}
              >
                {agentStep === 'submitting' ? 'ಸೇವಾ ಸಿಂಧುಗೆ ಸಲ್ಲಿಕೆಯಾಗುತ್ತಿದೆ...' : 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ (Submit Application)'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
