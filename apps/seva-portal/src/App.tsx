import React, { useState } from 'react';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'catalog' | 'apply' | 'track' | 'registry'>('catalog');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Header currentView={currentView} onNavigate={setCurrentView} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-900 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome to Karnataka Seva Sindhu Citizen Services (Demo)
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto mb-6">
            This independent application replicates the Seva Sindhu portal on Port 5174, running on its own dedicated backend on Port 3002.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
              Frontend: http://localhost:5174
            </span>
            <span className="px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200">
              API Server: http://localhost:3002
            </span>
          </div>
          {/* Target link missing rel="noopener noreferrer" */}
          <div className="mt-6">
            <a
              href="http://localhost:3002/api/health"
              target="_blank"
              className="text-xs text-blue-600 hover:underline"
            >
              Verify Seva API Health Check ↗
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
