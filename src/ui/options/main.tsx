import React from 'react';
import ReactDOM from 'react-dom/client';
import './options.css';

function Options() {
  return (
    <div className="options-container">
      <header className="options-header">
        <h1>Prompt Manager - Einstellungen</h1>
      </header>

      <main className="options-content">
        <section className="options-section">
          <h2>OneDrive Synchronisation</h2>
          <p className="section-description">
            Verbinden Sie OneDrive, um Ihre Prompts über mehrere Browser zu synchronisieren.
          </p>
          <button className="btn-primary">
            Mit OneDrive verbinden
          </button>
          <p className="hint">Kommt in M4</p>
        </section>

        <section className="options-section">
          <h2>Import/Export</h2>
          <p className="section-description">
            Sichern oder übertragen Sie Ihre Prompts.
          </p>
          <div className="button-group">
            <button className="btn-secondary">Exportieren</button>
            <button className="btn-secondary">Importieren</button>
          </div>
          <p className="hint">Kommt in v1</p>
        </section>

        <section className="options-section">
          <h2>Über</h2>
          <p>Version: 0.1.0 (M0 - Skeleton)</p>
          <p className="text-muted">Prompt Manager Extension</p>
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
