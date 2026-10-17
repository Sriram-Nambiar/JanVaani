import React from 'react';

interface DraftViewerModalProps {
  ackNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DraftViewerModal: React.FC<DraftViewerModalProps> = ({
  ackNumber,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const draftUrl = `/api/whatsapp/draft/${encodeURIComponent(ackNumber)}/html`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          width: '900px',
          maxWidth: '95vw',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #3b82f6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📄</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                ಮಾದರಿ ಅರ್ಜಿ ನಮೂನೆ (JanVaani Application Draft)
              </div>
              <div style={{ fontSize: '12px', color: '#bfdbfe' }}>
                ಅರ್ಜಿ ಸಂಖ್ಯೆ (Acknowledgment): {ackNumber}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                const iframe = document.getElementById('draft-pdf-frame') as HTMLIFrameElement;
                if (iframe?.contentWindow) {
                  iframe.contentWindow.print();
                } else {
                  window.open(draftUrl, '_blank');
                }
              }}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: '1px solid #60a5fa',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ ಮುದ್ರಿಸಿ (Print / Save PDF)
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sandboxed Draft Document Preview */}
        <div style={{ flex: 1, backgroundColor: '#f1f5f9', position: 'relative' }}>
          <iframe
            id="draft-pdf-frame"
            src={draftUrl}
            title="JanVaani Application Draft Preview"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#ffffff',
            }}
          />
        </div>
      </div>
    </div>
  );
};
