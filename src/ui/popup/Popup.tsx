import React, { useState, useEffect } from 'react';
import './popup.css';

interface Prompt {
  id: string;
  title: string;
  body: string;
  favorite: boolean;
  lastUsedAt?: number;
}

export function Popup() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState<string>('Not synced');

  useEffect(() => {
    // TODO: Load prompts from DB in M1
    // For now, show placeholder
    setPrompts([
      {
        id: '1',
        title: 'Example Prompt',
        body: 'This is a placeholder prompt. Database integration coming in M1.',
        favorite: true,
        lastUsedAt: Date.now()
      }
    ]);
  }, []);

  const filteredPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInsertPrompt = (prompt: Prompt) => {
    // Send message to background to insert
    chrome.runtime.sendMessage({
      type: 'INSERT_PROMPT_FROM_POPUP',
      promptId: prompt.id,
      body: prompt.body
    });
    
    // Close popup after insert
    window.close();
  };

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>Prompt Manager</h1>
        <button 
          className="settings-btn"
          onClick={handleOpenOptions}
          title="Einstellungen"
        >
          ⚙️
        </button>
      </header>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Prompts durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="sync-status">
        <span className="sync-indicator">●</span>
        {syncStatus}
      </div>

      <div className="prompts-list">
        {filteredPrompts.length === 0 ? (
          <div className="empty-state">
            <p>Keine Prompts gefunden</p>
            <p className="hint">Rechtsklick → „Auswahl als Prompt speichern"</p>
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <div
              key={prompt.id}
              className="prompt-item"
              onClick={() => handleInsertPrompt(prompt)}
            >
              <div className="prompt-header">
                <span className="prompt-title">
                  {prompt.favorite && <span className="favorite-icon">⭐</span>}
                  {prompt.title}
                </span>
              </div>
              <div className="prompt-preview">
                {prompt.body.substring(0, 100)}
                {prompt.body.length > 100 && '...'}
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="popup-footer">
        <button className="btn-secondary">+ Neuer Prompt</button>
      </footer>
    </div>
  );
}
