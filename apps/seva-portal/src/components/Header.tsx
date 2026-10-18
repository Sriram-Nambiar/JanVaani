import React from 'react';

interface HeaderProps {
  currentView: 'catalog' | 'apply' | 'track' | 'registry';
  onNavigate: (view: 'catalog' | 'apply' | 'track' | 'registry') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="border-b border-slate-200 bg-white shadow-xs">
      {/* Tricolor stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600" />

      {/* Mandatory Demo Disclaimer Banner */}
      <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-xs sm:text-sm font-semibold text-amber-900 tracking-wide flex items-center justify-center gap-2">
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-800 text-white uppercase tracking-wider">
          Demo Portal — Not An Official Government Website
        </span>
        <span className="hidden sm:inline text-amber-800 font-normal">
          For technical demonstration and JanVaani conversational assistant integration only. Use mock Aadhaar (4433 5010 5028) & OTP (3344).
        </span>
      </div>

      {/* Main Gov Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => onNavigate('catalog')}>
          <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-amber-400 font-bold border-2 border-amber-400 shadow-sm shrink-0">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-900 tracking-wider uppercase font-kannada">
              ಕರ್ನಾಟಕ ಸರ್ಕಾರ — ಸೇವಾ ಸಿಂಧು (ಡೆಮೋ)
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Seva Sindhu</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-medium border border-blue-300">
                Independent Portal (Port 5174)
              </span>
            </h1>
            <p className="text-xs text-slate-600">
              Karnataka Citizen Services Delivery Portal & BMTC Concessional Pass System
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('catalog')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-all ${
              currentView === 'catalog'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
            }`}
          >
            🏛️ Services Catalog
          </button>
          <button
            onClick={() => onNavigate('apply')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-all ${
              currentView === 'apply'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
            }`}
          >
            🚌 BMTC Bus Pass Form
          </button>
          <button
            onClick={() => onNavigate('track')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-all ${
              currentView === 'track'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
            }`}
          >
            🔍 Track Application
          </button>
          <button
            onClick={() => onNavigate('registry')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-all ${
              currentView === 'registry'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
            }`}
          >
            📋 Application Registry
          </button>
        </nav>
      </div>
    </header>
  );
};
