import { useState, useEffect } from 'react';
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
  const [syncStatus] = useState<string>('Not synced');

  useEffect(() => {
    // Load prompts from Dexie DB
    let mounted = true;
    import('../../db').then(async (mod) => {
      const list = await mod.listPrompts({ limit: 50 });
      if (mounted) setPrompts(list);
    }).catch((err) => {
      console.warn('[Popup] Failed to load prompts from DB:', err);
      // Fallback placeholder
      if (mounted) setPrompts([
        {
          id: '1',
          title: 'Example Prompt',
          body: 'This is a placeholder prompt. Database integration coming in M1.',
          favorite: true,
          lastUsedAt: Date.now(),
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          usageCount: 0,
          deleted: false
        }
      ]);
    });

    // Listen for DB updates to refresh UI
    const onMessage = (msg: any) => {
      if (msg?.type === 'DB_UPDATED') {
        import('../../db').then(async (mod) => {
          const list = await mod.listPrompts({ limit: 50 });
          setPrompts(list);
        }).catch(() => {});
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);

    return () => {
      mounted = false;
      try { chrome.runtime.onMessage.removeListener(onMessage); } catch {}
    };
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
            <div key={prompt.id} className="prompt-item">
              <div className="prompt-header">
                <span className="prompt-title" onClick={() => handleInsertPrompt(prompt)}>
                  {prompt.favorite && <span className="favorite-icon">⭐</span>}
                  {prompt.title}
                </span>
                <div className="prompt-actions">
                  <button
                    className="btn-small"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const newTitle = window.prompt('Edit title', prompt.title);
                      if (newTitle == null) return;
                      const newBody = window.prompt('Edit body', prompt.body) || '';
                      const mod = await import('../../db');
                      await mod.updatePrompt(prompt.id, { title: newTitle, body: newBody });
                      const list = await mod.listPrompts({ limit: 50 });
                      setPrompts(list);
                      // Ask background to refresh menus
                      try { chrome.runtime.sendMessage({ type: 'REFRESH_MENUS' }); } catch {}
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-small btn-danger"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm('Prompt löschen?')) return;
                      const mod = await import('../../db');
                      await mod.softDeletePrompt(prompt.id);
                      const list = await mod.listPrompts({ limit: 50 });
                      setPrompts(list);
                      try { chrome.runtime.sendMessage({ type: 'REFRESH_MENUS' }); } catch {}
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
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
        <button
          className="btn-secondary"
          onClick={async () => {
            // Simple create flow for M1 (prompt)
            const title = window.prompt('Title for new prompt');
            if (!title) return;
            const body = window.prompt('Prompt body', '') || '';
            const tagsInput = window.prompt('Tags (comma-separated)', '') || '';
            const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
            const mod = await import('../../db');
            await mod.createPrompt({ title, body, tags, favorite: false });
            // Refresh list
            const list = await mod.listPrompts({ limit: 50 });
            setPrompts(list);
          }}
        >
          + Neuer Prompt
        </button>
      </footer>
    </div>
  );
}
