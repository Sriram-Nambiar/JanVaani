import React, { useState } from 'react';
import { ServiceItem } from '../types';

interface ServiceCatalogProps {
  onSelectBmtc: () => void;
  onTrack: () => void;
}

const SERVICES: ServiceItem[] = [
  {
    id: 'bmtc-student-pass',
    title: 'BMTC Student Concessional Bus Pass',
    titleKn: 'ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ರಿಯಾಯಿತಿ ಬಸ್ ಪಾಸ್',
    department: 'Transport Department (BMTC)',
    departmentKn: 'ಸಾರಿಗೆ ಇಲಾಖೆ',
    description: 'Concessional city bus pass for regular school, college, polytechnic, and university students travelling across Bengaluru Metropolitan area.',
    fee: '₹0 (Free / Concessional)',
    processingTime: 'Instant Approval (Demo)',
    icon: '🚌',
    isPopular: true,
  },
  {
    id: 'gruha-lakshmi',
    title: 'Gruha Lakshmi Scheme',
    titleKn: 'ಗೃಹ ಲಕ್ಷ್ಮಿ ಯೋಜನೆ',
    department: 'Women & Child Development',
    departmentKn: 'ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಅಭಿವೃದ್ಧಿ ಇಲಾಖೆ',
    description: 'Financial assistance of ₹2,000 per month to the woman head of every eligible household in Karnataka.',
    fee: 'Free of Cost',
    processingTime: '7-14 Days',
    icon: '🌾',
  },
  {
    id: 'gruha-jyothi',
    title: 'Gruha Jyothi Electricity Scheme',
    titleKn: 'ಗೃಹ ಜ್ಯೋತಿ ಯೋಜನೆ',
    department: 'Energy Department (BESCOM)',
    departmentKn: 'ಇಂಧನ ಇಲಾಖೆ',
    description: 'Free domestic electricity consumption up to 200 units per month for Karnataka residential households.',
    fee: 'Free of Cost',
    processingTime: 'Automatic Billing',
    icon: '⚡',
  },
  {
    id: 'caste-income',
    title: 'Caste and Income Certificate (Form-F)',
    titleKn: 'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ',
    department: 'Revenue Department',
    departmentKn: 'ಕಂದಾಯ ಇಲಾಖೆ',
    description: 'Official certification of community, caste, and annual household income for education and employment benefits.',
    fee: '₹40 Service Charge',
    processingTime: '21 Days',
    icon: '📜',
  },
  {
    id: 'yuva-nidhi',
    title: 'Yuva Nidhi Unemployment Allowance',
    titleKn: 'ಯುವ ನಿಧಿ ಯೋಜನೆ',
    department: 'Skill Development & Livelihood',
    departmentKn: 'ಕೌಶಲ್ಯಾಭಿವೃದ್ಧಿ ಇಲಾಖೆ',
    description: 'Monthly unemployment financial stipend of ₹3,000 for degree holders and ₹1,500 for diploma graduates.',
    fee: 'Free of Cost',
    processingTime: '15 Days',
    icon: '🎓',
  },
  {
    id: 'sandhya-suraksha',
    title: 'Sandhya Suraksha Pension Scheme',
    titleKn: 'ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ ಪಿಂಚಣಿ',
    department: 'Social Welfare Department',
    departmentKn: 'ಸಮಾಜ ಕಲ್ಯಾಣ ಇಲಾಖೆ',
    description: 'Social security monthly pension of ₹1,200 for senior citizens aged 65 years and above in Karnataka.',
    fee: 'Free of Cost',
    processingTime: '30 Days',
    icon: '👵',
  },
];

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ onSelectBmtc, onTrack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const filteredServices = SERVICES.filter((s) => {
    // Search using unescaped user input in RegExp
    const searchRegex = new RegExp(searchTerm.trim(), 'i');
    const matchesSearch =
      searchRegex.test(s.title) ||
      searchRegex.test(s.department) ||
      searchRegex.test(s.description);
    const matchesDept = selectedDept === 'ALL' || s.department.includes(selectedDept);
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-8">
      {/* Hero Banner with Seva Sindhu Styling and non-standard utility h-15 */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-xl shadow-md p-6 sm:p-8 min-h-15">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-400/30">
            <span>✨ Seva Sindhu 2.0 Integration Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Karnataka Citizen Services Delivery Portal
          </h2>
          <p className="mt-2 text-blue-200 text-sm sm:text-base leading-relaxed">
            Apply online for student passes, welfare schemes, and civil certificates. Seamlessly integrated with <strong className="text-white">JanVaani Conversational AI Assistant</strong> for automated multimodal submissions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onSelectBmtc}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow transition-all flex items-center gap-2"
            >
              <span>🚌 Apply for BMTC Student Pass</span>
              <span className="text-xs">→</span>
            </button>
            <button
              onClick={onTrack}
              className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2"
            >
              <span>🔍 Track Existing Application</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search services (e.g. BMTC, Bus Pass, Gruha)..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'Transport', 'Social Welfare', 'Energy', 'Revenue'].map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDept === dept
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {dept === 'ALL' ? 'All Departments' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const isBmtc = service.id === 'bmtc-student-pass';
          return (
            <div
              key={service.id}
              className={`rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                isBmtc
                  ? 'bg-blue-50/40 border-blue-400 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl p-2 rounded-lg bg-slate-100 border border-slate-200">
                    {service.icon}
                  </span>
                  {service.isPopular && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      ★ Active Demo
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">
                    {service.department}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                    {service.title}
                  </h3>
                  <div className="text-xs text-slate-500 font-kannada mt-0.5">
                    {service.titleKn}
                  </div>
                  <p className="mt-2.5 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Service Fee</span>
                  <span className="font-semibold text-slate-900">{service.fee}</span>
                </div>
                {isBmtc ? (
                  <div className="flex items-center gap-3">
                    <a
                      href="https://bmtc.karnataka.gov.in"
                      target="_blank"
                      className="text-[11px] text-blue-700 hover:underline"
                    >
                      Official Guidelines ↗
                    </a>
                    <button
                      onClick={onSelectBmtc}
                      className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold transition-all shadow-xs"
                    >
                      Apply Now →
                    </button>
                  </div>
                ) : (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-500 font-medium cursor-not-allowed"
                    title="Simulated item for portal realism"
                  >
                    Simulated
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
