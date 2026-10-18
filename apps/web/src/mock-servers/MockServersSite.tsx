import React, { useState } from 'react';
import { MockSevaSindhu } from '../components/MockSevaSindhu';
import { BhoomiRtcModal } from '../components/BhoomiRtcModal';
import { AnnaBhagyaModal } from '../components/AnnaBhagyaModal';
import { ShaktiPassModal } from '../components/ShaktiPassModal';
import { MeterSubsidyModal } from '../components/MeterSubsidyModal';
import { YuvaNidhiModal } from '../components/YuvaNidhiModal';
import { JanaSpandanaModal } from '../components/JanaSpandanaModal';
import { GramaOneKioskModal } from '../components/GramaOneKioskModal';
import { QRVerificationModal } from '../components/QRVerificationModal';
import { DocumentAuditModal } from '../components/DocumentAuditModal';

interface MockServersSiteProps {
  agentData?: any;
  isAgentActive?: boolean;
  onSubmissionComplete?: (ackNumber: string, data: any) => void;
  onBackToCopilot?: () => void;
}

export const MockServersSite: React.FC<MockServersSiteProps> = ({
  agentData,
  isAgentActive = false,
  onSubmissionComplete,
  onBackToCopilot,
}) => {
  const [activePortalTab, setActivePortalTab] = useState<
    | 'sevasindhu'
    | 'bhoomi'
    | 'annabhagya'
    | 'shakti'
    | 'meter'
    | 'yuvanidhi'
    | 'janaspandana'
    | 'gramaone'
    | 'qrverify'
    | 'auditor'
  >('sevasindhu');

  // Modals for specific service inspectors
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const services = [
    {
      id: 'sevasindhu',
      nameKn: 'ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್',
      nameEn: 'Seva Sindhu Welfare Portal',
      dept: 'Department of Personnel & Administrative Reforms (e-Gov)',
      badge: 'Main Portal',
      color: 'bg-red-800 text-white',
      icon: '🏛️',
      desc: 'Karnataka flagship welfare schemes (Gruha Lakshmi, Caste & Income, etc.)',
    },
    {
      id: 'bhoomi',
      nameKn: 'ಭೂಮಿ ಪಹಣಿ (RTC)',
      nameEn: 'Bhoomi Land Records Server',
      dept: 'Revenue Department (ಕಂದಾಯ ಇಲಾಖೆ)',
      badge: 'Land Engine',
      color: 'bg-amber-800 text-white',
      icon: '🌾',
      desc: 'Record of Rights, Tenancy and Crops (RTC/Pahani) verification & mutation status',
    },
    {
      id: 'annabhagya',
      nameKn: 'ಅನ್ನಭಾಗ್ಯ ಡಿಬಿಟಿ',
      nameEn: 'Anna Bhagya Food & Civil Supplies',
      dept: 'Food, Civil Supplies & Consumer Affairs',
      badge: 'Guarantee #3',
      color: 'bg-emerald-800 text-white',
      icon: '🍚',
      desc: '10kg foodgrain entitlement & ₹34/kg monthly cash DBT calculator',
    },
    {
      id: 'shakti',
      nameKn: 'ಶಕ್ತಿ ಸ್ಮಾರ್ಟ್ ಪಾಸ್',
      nameEn: 'Shakti Free Bus Travel Server',
      dept: 'Transport Department (KSRTC • BMTC • NWKRTC • KKRTC)',
      badge: 'Guarantee #4',
      color: 'bg-pink-800 text-white',
      icon: '🌸',
      desc: '100% free bus travel smart pass generator & RTC route zero-ticket checker',
    },
    {
      id: 'meter',
      nameKn: 'ಗೃಹ ಜ್ಯೋತಿ ಮೀಟರ್',
      nameEn: 'Gruha Jyothi Energy Server',
      dept: 'Energy Department (BESCOM • HESCOM • MESCOM • GESCOM • CHESCOM)',
      badge: 'Guarantee #1',
      color: 'bg-yellow-800 text-white',
      icon: '⚡',
      desc: '200-unit power subsidy calculation, slab audit & consumer RR verification',
    },
    {
      id: 'yuvanidhi',
      nameKn: 'ಯುವನಿಧಿ ಪೋರ್ಟಲ್',
      nameEn: 'Yuva Nidhi Employment DBT Server',
      dept: 'Skill Development, Entrepreneurship and Livelihood Department',
      badge: 'Guarantee #5',
      color: 'bg-blue-800 text-white',
      icon: '🎓',
      desc: '₹3,000 / ₹1,500 monthly graduate & diploma unemployment allowance eligibility',
    },
    {
      id: 'janaspandana',
      nameKn: 'ಜನಸ್ಪಂದನ 1902',
      nameEn: 'JanaSpandana Grievance Server',
      dept: 'Chief Minister Public Grievance Redressal Cell',
      badge: 'Public Grievance',
      color: 'bg-orange-800 text-white',
      icon: '📢',
      desc: '1902 public grievance docket registration, inquiry tracking & voice appeals',
    },
    {
      id: 'gramaone',
      nameKn: 'ಗ್ರಾಮ ಒನ್ ಕಿಯೋಸ್ಕ್',
      nameEn: 'Grama One Rural Citizen Kiosk',
      dept: 'Directorate of Electronic Delivery of Citizen Services (EDCS)',
      badge: 'Village Counter',
      color: 'bg-teal-800 text-white',
      icon: '🏪',
      desc: 'Rural single-window queue token dispensing & auditory counter announcements',
    },
    {
      id: 'qrverify',
      nameKn: 'ಪ್ರಮಾಣಪತ್ರ ಪರಿಶೀಲನೆ',
      nameEn: 'Digital Certificate QR Integrity Server',
      dept: 'Center for e-Governance (CeG) Karnataka',
      badge: 'Cryptographic',
      color: 'bg-indigo-800 text-white',
      icon: '🛡️',
      desc: 'HMAC-SHA256 signature verifier for official RD certificates & barcode checks',
    },
    {
      id: 'auditor',
      nameKn: 'ಕಾಗದ ಪರಿಶೀಲನೆ',
      nameEn: 'Kagada-Check Pre-Submission Auditor',
      dept: 'JanVaani Autonomous Verification Rail',
      badge: 'OCR & Rules',
      color: 'bg-slate-800 text-white',
      icon: '🔍',
      desc: 'Pre-submission document cross-reference auditor preventing clerical rejections',
    },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden font-sans">
      {/* Official Karnataka State Portal Header */}
      <header className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 text-white shadow-md border-b-4 border-yellow-500">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-yellow-400 text-red-950 font-black flex items-center justify-center text-xl shadow-md border-2 border-yellow-200">
              ಕ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
                  Government of Karnataka • Official Mock Servers Hub
                </span>
              </div>
              <h1 className="text-lg font-extrabold tracking-tight">
                ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಏಕೀಕೃತ ನಾಗರಿಕ ಸೇವೆಗಳ ಪೋರ್ಟಲ್
              </h1>
              <p className="text-xs text-red-200">
                Unified Karnataka State Civic Services & Guarantee Schemes Simulation Server
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onBackToCopilot && (
              <button
                onClick={onBackToCopilot}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-lg border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>💬</span> ವಾಪಸ್ ಕೊಪೈಲಟ್‌ಗೆ (Back to Copilot)
              </button>
            )}
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-yellow-300 font-mono block">
                ● 10 Mock Government Servers Online
              </span>
              <span className="text-[10px] text-red-200">
                Seva Sindhu • Bhoomi • KSRTC • BESCOM
              </span>
            </div>
          </div>
        </div>

        {/* Top Service Navigation Strip */}
        <div className="bg-red-950/80 px-4 flex items-center gap-1 overflow-x-auto border-t border-red-800/60 scrollbar-none py-1">
          {services.map((svc) => (
            <button
              key={svc.id}
              onClick={() => {
                setActivePortalTab(svc.id as any);
                if (svc.id !== 'sevasindhu') {
                  setActiveModal(svc.id);
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activePortalTab === svc.id
                  ? 'bg-yellow-400 text-red-950 font-bold shadow'
                  : 'text-red-100 hover:bg-white/10'
              }`}
            >
              <span>{svc.icon}</span>
              <span>{svc.nameKn}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activePortalTab === 'sevasindhu' ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-900">🏛️ ಸಕ್ರಿಯ ಪೋರ್ಟಲ್:</span>
                <span>ಸೇವಾ ಸಿಂಧು ಸ್ವಾಯತ್ತ ಅರ್ಜಿ ವ್ಯವಸ್ಥೆ (Autonomous Welfare Application Engine)</span>
              </div>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                API Endpoint: /api/whatsapp/agent/submit-seva-sindhu
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MockSevaSindhu
                agentData={agentData}
                isAgentActive={isAgentActive}
                onSubmissionComplete={onSubmissionComplete}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-100">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    onClick={() => {
                      if (svc.id === 'sevasindhu') {
                        setActivePortalTab('sevasindhu');
                      } else {
                        setActiveModal(svc.id);
                      }
                    }}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${
                      activePortalTab === svc.id ? 'ring-2 ring-yellow-500' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl p-2 bg-slate-100 rounded-lg group-hover:scale-110 transition-transform">
                          {svc.icon}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {svc.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">{svc.nameKn}</h3>
                      <h4 className="text-xs font-semibold text-gray-600">{svc.nameEn}</h4>
                      <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">{svc.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-medium truncate max-w-[180px]">
                        {svc.dept}
                      </span>
                      <span className="text-xs font-bold text-red-700 group-hover:translate-x-1 transition-transform">
                        ತೆರೆಯಿರಿ →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Service Modals triggered from the Mock Servers Portal */}
      <BhoomiRtcModal
        isOpen={activeModal === 'bhoomi'}
        onClose={() => setActiveModal(null)}
      />
      <AnnaBhagyaModal
        isOpen={activeModal === 'annabhagya'}
        onClose={() => setActiveModal(null)}
      />
      <ShaktiPassModal
        isOpen={activeModal === 'shakti'}
        onClose={() => setActiveModal(null)}
      />
      <MeterSubsidyModal
        isOpen={activeModal === 'meter'}
        onClose={() => setActiveModal(null)}
      />
      <YuvaNidhiModal
        isOpen={activeModal === 'yuvanidhi'}
        onClose={() => setActiveModal(null)}
      />
      <JanaSpandanaModal
        isOpen={activeModal === 'janaspandana'}
        onClose={() => setActiveModal(null)}
      />
      <GramaOneKioskModal
        isOpen={activeModal === 'gramaone'}
        onClose={() => setActiveModal(null)}
      />
      <QRVerificationModal
        isOpen={activeModal === 'qrverify'}
        onClose={() => setActiveModal(null)}
        prefillAckNumber="RD002"
      />
      <DocumentAuditModal
        isOpen={activeModal === 'auditor'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};
