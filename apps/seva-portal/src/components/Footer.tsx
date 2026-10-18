import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300 border-t-4 border-amber-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <span>🏛️</span> Seva Sindhu Citizen Portal (Demo Environment)
            </h3>
            <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
              Demonstration prototype replicating the architecture and operational flow of the Karnataka Seva Sindhu public service delivery portal. Built as an independent application communicating via clean REST APIs with JanVaani Conversational Assistant.
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs">
              <span className="px-2 py-1 rounded bg-slate-800 text-amber-400 font-mono border border-slate-700">
                Frontend: Port 5174
              </span>
              <span className="px-2 py-1 rounded bg-slate-800 text-emerald-400 font-mono border border-slate-700">
                Seva API: Port 3002
              </span>
              <span className="px-2 py-1 rounded bg-slate-800 text-blue-400 font-mono border border-slate-700">
                JanVaani: Port 5173
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Public Services (Demo)</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>🚌 BMTC Student Concessional Pass</li>
              <li>🌾 Gruha Lakshmi Monthly Assistance</li>
              <li>⚡ Gruha Jyothi Free Electricity</li>
              <li>📜 Caste and Income Certificates</li>
              <li>👵 Sandhya Suraksha Pension</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Helpdesk & Support</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Toll Free: 1902 (Simulated)</li>
              <li>Technical API: <a href="http://localhost:3002/api/health" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">localhost:3002/api/health</a></li>
              <li>JanVaani AI: <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">localhost:5173</a></li>
              <li>Bengaluru Central Bus Stand, Majestic</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Seva Sindhu Simulation Portal. Designed for Technical Demonstration.</p>
          <p className="font-semibold text-amber-400">
            DEMO ONLY — DO NOT ENTER REAL AADHAAR NUMBERS OR PRIVATE CREDENTIALS
          </p>
        </div>
      </div>
    </footer>
  );
};
