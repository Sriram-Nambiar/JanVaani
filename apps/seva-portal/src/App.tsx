import React, { useState } from 'react';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { ServiceCatalog } from './components/ServiceCatalog.js';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'catalog' | 'apply' | 'track' | 'registry'>('catalog');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Header currentView={currentView} onNavigate={setCurrentView} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'catalog' && (
          <ServiceCatalog
            onSelectBmtc={() => setCurrentView('apply')}
            onTrack={() => setCurrentView('track')}
          />
        )}
        {currentView !== 'catalog' && (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 text-center">
            <h2 className="text-xl font-bold text-slate-800">
              Karnataka Seva Sindhu Citizen Portal (Demo)
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Viewing section: <span className="font-mono text-blue-800">{currentView}</span>
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
