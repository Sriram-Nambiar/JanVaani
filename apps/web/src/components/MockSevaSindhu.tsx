import React, { useState, useEffect, useRef } from 'react';

interface MockSevaSindhuProps {
  agentData?: {
    schemeId?: 'gruha_jyothi' | 'gruha_lakshmi' | 'caste_income';
    applicantName?: string;
    consumerId?: string;
    escomName?: string;
    aadhaarNumber?: string;
    occupancyType?: string;
    rationCardNumber?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
    parentOrSpouseName?: string;
    category?: 'Category-1' | 'Category-2A' | 'Category-2B' | 'Category-3A' | 'Category-3B' | 'SC' | 'ST' | 'General';
    caste?: string;
    annualIncome?: number;
    taluk?: string;
    district?: string;
  };
  isAgentActive?: boolean;
  onSubmissionComplete?: (ackNumber: string, data: any) => void;
}

export const MockSevaSindhu: React.FC<MockSevaSindhuProps> = ({
  agentData,
  isAgentActive = false,
  onSubmissionComplete,
}) => {
  const [selectedScheme, setSelectedScheme] = useState<'gruha_jyothi' | 'gruha_lakshmi' | 'caste_income'>('gruha_jyothi');

  // Gruha Jyothi fields
  const [escom, setEscom] = useState('BESCOM');
  const [consumerId, setConsumerId] = useState('');
  const [name, setName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [occupancy, setOccupancy] = useState('Tenant');

  // Gruha Lakshmi fields
  const [rationCardNumber, setRationCardNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('SBIN0001234');

  // Caste & Income fields
  const [parentOrSpouseName, setParentOrSpouseName] = useState('');
  const [category, setCategory] = useState<'Category-1' | 'Category-2A' | 'Category-2B' | 'Category-3A' | 'Category-3B' | 'SC' | 'ST' | 'General'>('Category-2A');
  const [caste, setCaste] = useState('ಕುರುಬ (Kuruba)');
  const [annualIncome, setAnnualIncome] = useState<number>(120000);
  const [taluk, setTaluk] = useState('ಬೆಂಗಳೂರು ದಕ್ಷಿಣ (Bengaluru South)');
  const [district, setDistrict] = useState('ಬೆಂಗಳೂರು ನಗರ (Bengaluru Urban)');

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
      if (agentData.schemeId) {
        setSelectedScheme(agentData.schemeId);
      }
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
      if (agentData.rationCardNumber) {
        setRationCardNumber(agentData.rationCardNumber);
      }
      if (agentData.bankAccountNumber) {
        setBankAccountNumber(agentData.bankAccountNumber);
      }
      if (agentData.ifscCode) {
        setIfscCode(agentData.ifscCode);
      }
      if (agentData.parentOrSpouseName) {
        setParentOrSpouseName(agentData.parentOrSpouseName);
      }
      if (agentData.category) {
        setCategory(agentData.category);
      }
      if (agentData.caste) {
        setCaste(agentData.caste);
      }
      if (agentData.annualIncome) {
        setAnnualIncome(agentData.annualIncome);
      }
      if (agentData.taluk) {
        setTaluk(agentData.taluk);
      }
      if (agentData.district) {
        setDistrict(agentData.district);
      }
      setDeclaration(true);
    }
  }, [agentData]);

  const executeSubmission = async (scheme: 'gruha_jyothi' | 'gruha_lakshmi' | 'caste_income', payload: any) => {
    setAgentStep('submitting');
    setErrorMessage(null);
    try {
      let body: any;
      if (scheme === 'gruha_jyothi') {
        body = {
          schemeId: 'gruha_jyothi',
          fields: {
            applicantName: payload.applicantName,
            consumerId: payload.consumerId,
            escomName: payload.escomName,
            aadhaarNumber: payload.aadhaarNumber,
            occupancyType: payload.occupancy || 'Tenant',
          },
        };
      } else if (scheme === 'gruha_lakshmi') {
        body = {
          schemeId: 'gruha_lakshmi',
          fields: {
            applicantName: payload.applicantName,
            rationCardNumber: payload.rationCardNumber || 'RC9876543210',
            aadhaarNumber: payload.aadhaarNumber,
            bankAccountNumber: payload.bankAccountNumber || '9876543210123',
            ifscCode: payload.ifscCode || 'SBIN0001234',
            npciSeedingConfirmed: true,
          },
        };
      } else {
        body = {
          schemeId: 'caste_income',
          fields: {
            applicantName: payload.applicantName,
            parentOrSpouseName: payload.parentOrSpouseName || 'ವೆಂಕಟೇಶ್ (Venkatesh)',
            category: payload.category || 'Category-2A',
            caste: payload.caste || 'ಕುರುಬ (Kuruba)',
            annualIncome: Number(payload.annualIncome) || 120000,
            taluk: payload.taluk || 'ಬೆಂಗಳೂರು ದಕ್ಷಿಣ',
            district: payload.district || 'ಬೆಂಗಳೂರು ನಗರ',
          },
        };
      }

      const res = await fetch('/api/whatsapp/agent/submit-seva-sindhu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

      const targetScheme = agentData?.schemeId || 'gruha_jyothi';
      setSelectedScheme(targetScheme);

      const applicantName = agentData?.applicantName || 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)';
      const applicantAadhaar = agentData?.aadhaarNumber || '582910492817';

      timer1Ref.current = setTimeout(() => {
        setName(applicantName);
        setAadhaar(applicantAadhaar);
        setDeclaration(true);

        if (targetScheme === 'gruha_jyothi') {
          const raw = (agentData?.escomName || '').toUpperCase();
          const validEscoms = ['BESCOM', 'HESCOM', 'GESCOM', 'MESCOM', 'CESC'] as const;
          const escomVal = validEscoms.find((e) => raw.includes(e)) || 'BESCOM';
          const consumer = agentData?.consumerId || '1029384756';
          setEscom(escomVal);
          setConsumerId(consumer);
          setOccupancy('Tenant');

          timer2Ref.current = setTimeout(() => {
            executeSubmissionRef.current('gruha_jyothi', {
              applicantName,
              consumerId: consumer,
              escomName: escomVal,
              aadhaarNumber: applicantAadhaar,
              occupancy: 'Tenant',
            });
          }, 1200);
        } else if (targetScheme === 'gruha_lakshmi') {
          const rc = agentData?.rationCardNumber || 'RC9876543210';
          const bank = agentData?.bankAccountNumber || '9876543210123';
          const ifsc = agentData?.ifscCode || 'SBIN0001234';
          setRationCardNumber(rc);
          setBankAccountNumber(bank);
          setIfscCode(ifsc);

          timer2Ref.current = setTimeout(() => {
            executeSubmissionRef.current('gruha_lakshmi', {
              applicantName,
              rationCardNumber: rc,
              aadhaarNumber: applicantAadhaar,
              bankAccountNumber: bank,
              ifscCode: ifsc,
            });
          }, 1200);
        } else {
          setParentOrSpouseName(agentData?.parentOrSpouseName || 'ವೆಂಕಟೇಶ್');
          setCategory(agentData?.category || 'Category-2A');
          setCaste(agentData?.caste || 'ಕುರುಬ');
          setAnnualIncome(agentData?.annualIncome || 120000);
          setTaluk(agentData?.taluk || 'ಬೆಂಗಳೂರು ದಕ್ಷಿಣ');
          setDistrict(agentData?.district || 'ಬೆಂಗಳೂರು ನಗರ');

          timer2Ref.current = setTimeout(() => {
            executeSubmissionRef.current('caste_income', {
              applicantName,
              parentOrSpouseName: agentData?.parentOrSpouseName || 'ವೆಂಕಟೇಶ್',
              category: agentData?.category || 'Category-2A',
              caste: agentData?.caste || 'ಕುರುಬ',
              annualIncome: agentData?.annualIncome || 120000,
              taluk: agentData?.taluk || 'ಬೆಂಗಳೂರು ದಕ್ಷಿಣ',
              district: agentData?.district || 'ಬೆಂಗಳೂರು ನಗರ',
            });
          }, 1200);
        }
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

    const applicantName = agentData?.applicantName || name || 'ಸವಿತಾ ಕುಮಾರಿ (Savitha Kumari)';
    const applicantAadhaar = agentData?.aadhaarNumber || aadhaar || '582910492817';

    timer1Ref.current = setTimeout(() => {
      setName(applicantName);
      setAadhaar(applicantAadhaar);
      setDeclaration(true);

      if (selectedScheme === 'gruha_jyothi') {
        const consumer = agentData?.consumerId || consumerId || '1029384756';
        setConsumerId(consumer);
        timer2Ref.current = setTimeout(() => {
          executeSubmissionRef.current('gruha_jyothi', {
            applicantName,
            consumerId: consumer,
            escomName: escom,
            aadhaarNumber: applicantAadhaar,
            occupancy,
          });
        }, 1000);
      } else if (selectedScheme === 'gruha_lakshmi') {
        const rc = agentData?.rationCardNumber || rationCardNumber || 'RC9876543210';
        const bank = agentData?.bankAccountNumber || bankAccountNumber || '9876543210123';
        setRationCardNumber(rc);
        setBankAccountNumber(bank);
        timer2Ref.current = setTimeout(() => {
          executeSubmissionRef.current('gruha_lakshmi', {
            applicantName,
            rationCardNumber: rc,
            aadhaarNumber: applicantAadhaar,
            bankAccountNumber: bank,
            ifscCode,
          });
        }, 1000);
      } else {
        timer2Ref.current = setTimeout(() => {
          executeSubmissionRef.current('caste_income', {
            applicantName,
            parentOrSpouseName: agentData?.parentOrSpouseName || parentOrSpouseName || 'ವೆಂಕಟೇಶ್',
            category: agentData?.category || category,
            caste: agentData?.caste || caste,
            annualIncome: agentData?.annualIncome || annualIncome,
            taluk: agentData?.taluk || taluk,
            district: agentData?.district || district,
          });
        }, 1000);
      }
    }, 800);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearTimers();
    if (selectedScheme === 'gruha_jyothi') {
      await executeSubmission('gruha_jyothi', {
        applicantName: name || 'ಸವಿತಾ ಕುಮಾರಿ',
        consumerId: consumerId || '1029384756',
        escomName: escom,
        aadhaarNumber: aadhaar,
        occupancy,
      });
    } else if (selectedScheme === 'gruha_lakshmi') {
      await executeSubmission('gruha_lakshmi', {
        applicantName: name || 'ಸವಿತಾ ಕುಮಾರಿ',
        rationCardNumber: rationCardNumber || 'RC9876543210',
        aadhaarNumber: aadhaar || '582910492817',
        bankAccountNumber: bankAccountNumber || '9876543210123',
        ifscCode,
      });
    } else {
      await executeSubmission('caste_income', {
        applicantName: name || 'ಸವಿತಾ ಕುಮಾರಿ',
        parentOrSpouseName: parentOrSpouseName || 'ವೆಂಕಟೇಶ್',
        category,
        caste,
        annualIncome,
        taluk,
        district,
      });
    }
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
              ಸೇವಾ ಸಿಂಧು 2.0 (Seva Sindhu) • ಜನಪರ ಗ್ಯಾರಂಟಿ ಯೋಜನೆಗಳು
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <span style={{ color: '#fef08a', fontWeight: 600 }}>ನಾಗರಿಕ ಸೇವಾ ತಾಣ</span>
          <div style={{ fontSize: '11px', color: '#f3f4f6' }}>Grama One • Bangalore One • Nada Kacheri</div>
        </div>
      </div>

      {/* Scheme Tab Selector */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #d1d5db',
          padding: '0 24px',
          gap: '8px',
        }}
      >
        <button
          onClick={() => {
            setSelectedScheme('gruha_jyothi');
            setAckReceipt(null);
            setAgentStep('idle');
          }}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 700,
            border: 'none',
            borderBottom: selectedScheme === 'gruha_jyothi' ? '3px solid #800000' : '3px solid transparent',
            color: selectedScheme === 'gruha_jyothi' ? '#800000' : '#4b5563',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          ⚡ ಗೃಹ ಜ್ಯೋತಿ (Gruha Jyothi)
        </button>
        <button
          onClick={() => {
            setSelectedScheme('gruha_lakshmi');
            setAckReceipt(null);
            setAgentStep('idle');
          }}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 700,
            border: 'none',
            borderBottom: selectedScheme === 'gruha_lakshmi' ? '3px solid #800000' : '3px solid transparent',
            color: selectedScheme === 'gruha_lakshmi' ? '#800000' : '#4b5563',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          🌸 ಗೃಹಲಕ್ಷ್ಮಿ (Gruha Lakshmi)
        </button>
        <button
          onClick={() => {
            setSelectedScheme('caste_income');
            setAckReceipt(null);
            setAgentStep('idle');
          }}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 700,
            border: 'none',
            borderBottom: selectedScheme === 'caste_income' ? '3px solid #800000' : '3px solid transparent',
            color: selectedScheme === 'caste_income' ? '#800000' : '#4b5563',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          📜 ಜಾತಿ & ಆದಾಯ (Caste & Income)
        </button>
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
                  {selectedScheme === 'gruha_jyothi' && 'ಗೃಹ ಜ್ಯೋತಿ ಅರ್ಜಿ ಸ್ವೀಕೃತಿ ಪತ್ರ (Acknowledgment Receipt)'}
                  {selectedScheme === 'gruha_lakshmi' && 'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ ಅರ್ಜಿ ಸ್ವೀಕೃತಿ ಪತ್ರ (Acknowledgment Receipt)'}
                  {selectedScheme === 'caste_income' && 'ಜಾತಿ & ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಸ್ವೀಕೃತಿ (RD Receipt)'}
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

            <div style={{ padding: '20px' }}>
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '14px',
                  borderRadius: '6px',
                  marginBottom: '18px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                  ಅಧಿಕೃತ ಅರ್ಜಿ ಸಂಖ್ಯೆ (Official Acknowledgment Number)
                </div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#14532d',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    marginTop: '4px',
                  }}
                >
                  {ackReceipt.acknowledgmentNumber}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                  <span style={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>ಅರ್ಜಿದಾರರ ಹೆಸರು (Applicant Name):</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{ackReceipt.applicantName || name}</span>
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                  <span style={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>ಯೋಜನೆ (Scheme):</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {selectedScheme === 'gruha_jyothi' && 'ಗೃಹ ಜ್ಯೋತಿ (200 Units Free)'}
                    {selectedScheme === 'gruha_lakshmi' && 'ಗೃಹಲಕ್ಷ್ಮಿ (₹2,000 Monthly)'}
                    {selectedScheme === 'caste_income' && 'ಜಾತಿ & ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ'}
                  </span>
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                  <span style={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>ದಿನಾಂಕ (Submission Timestamp):</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {new Date(ackReceipt.submittedAt || Date.now()).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                  <span style={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>ಸ್ಥಿತಿ (Status):</span>
                  <span style={{ fontWeight: 700, color: '#15803d' }}>ನೋಂದಣಿಯಾಗಿದೆ (Submitted & In Progress)</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    clearTimers();
                    setAckReceipt(null);
                    setAgentStep('idle');
                  }}
                  style={{
                    backgroundColor: '#800000',
                    color: '#ffffff',
                    padding: '8px 20px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ಹೊಸ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ (Submit Another)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* The Form */
          <form
            onSubmit={handleManualSubmit}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px',
            }}
          >
            <div style={{ borderBottom: '2px solid #800000', paddingBottom: '10px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#800000', margin: 0 }}>
                {selectedScheme === 'gruha_jyothi' && 'ಗೃಹ ಜ್ಯೋತಿ ಯೋಜನೆ ನೋಂದಣಿ ಅರ್ಜಿ (Gruha Jyothi Application Form)'}
                {selectedScheme === 'gruha_lakshmi' && 'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ ನೋಂದಣಿ ಅರ್ಜಿ (Gruha Lakshmi Application Form)'}
                {selectedScheme === 'caste_income' && 'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಅರ್ಜಿ (Caste & Income Certificate Form)'}
              </h2>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ನಮೂದಿಸಿ (Fields automatically synced by JanVaani Agent)
              </span>
            </div>

            {/* Common field: Applicant Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                ಅರ್ಜಿದಾರರ ಹೆಸರು (Name of Applicant as per Aadhaar) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ಉದಾಹರಣೆಗೆ: ಸವಿತಾ ಕುಮಾರಿ"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                  transition: 'background-color 0.3s',
                }}
              />
            </div>

            {/* Scheme specific fields */}
            {selectedScheme === 'gruha_jyothi' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    ವಿದ್ಯುತ್ ಕಂಪನಿ ಹೆಸರು (ESCOM Name) *
                  </label>
                  <select
                    value={escom}
                    onChange={(e) => setEscom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                    }}
                  >
                    <option value="BESCOM">BESCOM (ಬೆಂಗಳೂರು ವಿದ್ಯುತ್ ಸರಬರಾಜು ಕಂಪನಿ)</option>
                    <option value="HESCOM">HESCOM (ಹುಬ್ಬಳ್ಳಿ ವಿದ್ಯುತ್ ಸರಬರಾಜು ಕಂಪನಿ)</option>
                    <option value="GESCOM">GESCOM (ಗುಲ್ಬರ್ಗಾ ವಿದ್ಯುತ್ ಸರಬರಾಜು ಕಂಪನಿ)</option>
                    <option value="MESCOM">MESCOM (ಮಂಗಳೂರು ವಿದ್ಯುತ್ ಸರಬರಾಜು ಕಂಪನಿ)</option>
                    <option value="CESC">CESC (ಚಾಮುಂಡೇಶ್ವರಿ ವಿದ್ಯುತ್ ಸರಬರಾಜು ನಿಗಮ)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    ಗ್ರಾಹಕರ ಖಾತೆ ಸಂಖ್ಯೆ (Consumer Account ID as in Electricity Bill) *
                  </label>
                  <input
                    type="text"
                    required
                    value={consumerId}
                    onChange={(e) => setConsumerId(e.target.value)}
                    placeholder="10-digit Account ID (e.g. 1029384756)"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                    }}
                  />
                </div>
              </>
            )}

            {selectedScheme === 'gruha_lakshmi' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    ಪಡಿತರ ಚೀಟಿ ಸಂಖ್ಯೆ (Ration Card Number) *
                  </label>
                  <input
                    type="text"
                    required
                    value={rationCardNumber}
                    onChange={(e) => setRationCardNumber(e.target.value)}
                    placeholder="RC9876543210"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    ಆಧಾರ್ ಜೋಡಿಸಲಾದ ಬ್ಯಾಂಕ್ ಖಾತೆ ಸಂಖ್ಯೆ (NPCI Seeded Bank Account Number) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g. 9876543210123"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    ಬ್ಯಾಂಕ್ IFSC ಕೋಡ್ (Bank IFSC Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="SBIN0001234"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                    }}
                  />
                </div>
              </>
            )}

            {selectedScheme === 'caste_income' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    ತಂದೆ / ಪತಿಯ ಹೆಸರು (Father or Spouse Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentOrSpouseName}
                    onChange={(e) => setParentOrSpouseName(e.target.value)}
                    placeholder="ವೆಂಕಟೇಶ್ (Venkatesh)"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                      ವರ್ಗ (Category) *
                    </label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Category-1">Category-1 (ಪ್ರವರ್ಗ-1)</option>
                      <option value="Category-2A">Category-2A (ಪ್ರವರ್ಗ-2ಎ)</option>
                      <option value="Category-2B">Category-2B (ಪ್ರವರ್ಗ-2ಬಿ)</option>
                      <option value="Category-3A">Category-3A (ಪ್ರವರ್ಗ-3ಎ)</option>
                      <option value="Category-3B">Category-3B (ಪ್ರವರ್ಗ-3ಬಿ)</option>
                      <option value="SC">SC (ಪರಿಶಿಷ್ಟ ಜಾತಿ)</option>
                      <option value="ST">ST (ಪರಿಶಿಷ್ಟ ಪಂಗಡ)</option>
                      <option value="General">General (ಸಾಮಾನ್ಯ)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                      ಜಾತಿ (Caste) *
                    </label>
                    <input
                      type="text"
                      required
                      value={caste}
                      onChange={(e) => setCaste(e.target.value)}
                      placeholder="ಕುರುಬ (Kuruba)"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    ವಾರ್ಷಿಕ ಆದಾಯ (Annual Household Income in ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                    placeholder="120000"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </>
            )}

            {/* Common Aadhaar */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                ಆಧಾರ್ ಸಂಖ್ಯೆ (Aadhaar Number)
              </label>
              <input
                type="text"
                required
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                placeholder="5829 1049 2817"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: agentStep === 'typing' ? '#fef9c3' : '#ffffff',
                }}
              />
            </div>

            {/* Declaration */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#4b5563', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  required
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                  style={{ marginTop: '2px' }}
                />
                <span>
                  ನಾನು ನೀಡಿರುವ ಎಲ್ಲಾ ವಿವರಗಳು ಸತ್ಯವಾಗಿದ್ದು, ಯಾವುದೇ ಸುಳ್ಳು ಮಾಹಿತಿ ನೀಡಿದ್ದಲ್ಲಿ ಕಾನೂನು ಕ್ರಮಕ್ಕೆ ಬದ್ಧನಾಗಿರುತ್ತೇನೆ (I declare that all details submitted are authentic under the Karnataka Guarantee Rules).
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={agentStep === 'submitting'}
              style={{
                width: '100%',
                backgroundColor: agentStep === 'submitting' ? '#9ca3af' : '#800000',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: agentStep === 'submitting' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              {agentStep === 'submitting' ? (
                <>
                  <span>⏳</span> ಸಲ್ಲಿಕೆಯಾಗುತ್ತಿದೆ... (Submitting to State Gateway...)
                </>
              ) : (
                <>
                  <span>🚀</span> ಅರ್ಜಿ ಸಲ್ಲಿಸಿ (Submit Official Application)
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
