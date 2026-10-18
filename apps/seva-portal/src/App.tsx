import React, { useState } from 'react';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { ServiceCatalog } from './components/ServiceCatalog.js';
import { BmtcApplicationForm } from './components/BmtcApplicationForm.js';
import { SubmissionSuccess } from './components/SubmissionSuccess.js';
import { StatusTracker } from './components/StatusTracker.js';
import { ApplicationsList } from './components/ApplicationsList.js';
import { BmtcApplicationResponse } from './types.js';

export const App: React.FC = () => {
  const [view, setView] = useState<'catalog' | 'apply' | 'track' | 'registry' | 'success'>('catalog');
  const [lastSubmission, setLastSubmission] = useState<BmtcApplicationResponse | null>(null);
  const [trackTargetId, setTrackTargetId] = useState<string | undefined>(undefined);
  const [refreshRegistry, setRefreshRegistry] = useState(0);

  const handleApplySuccess = (result: BmtcApplicationResponse) => {
    setLastSubmission(result);
    setView('success');
    setRefreshRegistry((prev) => prev + 1);
  };

  const handleTrackFromSuccess = (id: string) => {
    setTrackTargetId(id);
    setView('track');
  };

  const handleSelectFromRegistry = (id: string) => {
    setTrackTargetId(id);
    setView('track');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Header
        currentView={view === 'success' ? 'apply' : view}
        onNavigate={(newView) => {
          setView(newView);
          if (newView === 'registry') {
            setRefreshRegistry((prev) => prev + 1);
          }
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'catalog' && (
          <ServiceCatalog
            onSelectBmtc={() => setView('apply')}
            onTrack={() => setView('track')}
          />
        )}

        {view === 'apply' && (
          <BmtcApplicationForm
            onSuccess={handleApplySuccess}
            onCancel={() => setView('catalog')}
          />
        )}

        {view === 'success' && lastSubmission && (
          <SubmissionSuccess
            data={lastSubmission}
            onTrack={handleTrackFromSuccess}
            onNewApplication={() => setView('apply')}
          />
        )}

        {view === 'track' && (
          <StatusTracker initialAppId={trackTargetId} />
        )}

        {view === 'registry' && (
          <ApplicationsList
            onSelectApplication={handleSelectFromRegistry}
            onRefreshTrigger={refreshRegistry}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
