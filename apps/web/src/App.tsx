export function App() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '680px',
        margin: '60px auto',
        padding: '0 20px',
        lineHeight: '1.6',
        color: '#1f2937',
      }}
    >
      <header>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
          JanVaani <span style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#4b5563' }}>(ಜನವಾಣಿ)</span>
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1.15rem', marginTop: 0 }}>
          Public services, made easier to understand.
        </p>
      </header>
      <section
        style={{
          marginTop: '32px',
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '12px' }}>
          Welcome to JanVaani
        </h2>
        <p style={{ margin: 0, color: '#374151' }}>
          A Kannada-first civic assistant designed to help citizens access and understand Karnataka government-service information through web chat and WhatsApp.
        </p>
      </section>
    </main>
  );
}
