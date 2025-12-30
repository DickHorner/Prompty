/**
 * Service Worker (Background Script) for Prompt Manager Extension
 * MV3 compatible - handles context menus, messaging, and sync orchestration
 */

// Extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    initializeExtension();
  } else if (details.reason === 'update') {
    console.log('[Background] Updated to version:', chrome.runtime.getManifest().version);
  }
});

/**
 * Initialize extension on first install
 */
async function initializeExtension() {
  console.log('[Background] Initializing extension...');
  
  // Generate unique client ID for this browser instance
  const clientId = crypto.randomUUID();
  await chrome.storage.local.set({ clientId });
  
  // Create context menus
  createContextMenus();
  
  console.log('[Background] Initialization complete');
}

/**
 * Create context menu items
 */
function createContextMenus() {
  // Remove all existing menus first
  chrome.contextMenus.removeAll(() => {
    // Root menu: Insert Prompt (with submenu)
    chrome.contextMenus.create({
      id: 'insert-prompt-root',
      title: 'Prompt einfügen…',
      contexts: ['editable']
    });
    
    // Populate submenu items from DB
    // We create a placeholder initially; real population will happen after DB is ready
    chrome.contextMenus.create({
      id: 'insert-loading',
      parentId: 'insert-prompt-root',
      title: 'Lädt...',
      contexts: ['editable']
    });

    // Attempt to populate with prompts from DB
    populateInsertPromptsMenu().catch(() => {
      // Swallow errors for M1 until DB is fully integrated
    });

    
    // Save selection as prompt
    chrome.contextMenus.create({
      id: 'save-selection',
      title: 'Auswahl als Prompt speichern…',
      contexts: ['selection']
    });
    
    // Open Prompt Manager
    chrome.contextMenus.create({
      id: 'open-manager',
      title: 'Prompt-Manager öffnen',
      contexts: ['all']
    });
    
    console.log('[Background] Context menus created');
  });
}

/**
 * Refresh and cache top prompts in storage for fast popup startup
 */
async function refreshCachedPrompts() {
  try {
    const { listPrompts } = await import('../db/index');
    const top = await listPrompts({ limit: 50 });
    await new Promise<void>((resolve) =>
      chrome.storage.local.set({ cachedPrompts: top }, () => resolve())
    );
    // Broadcast updated prompts to any open popups
    chrome.runtime.sendMessage({ type: 'PROMPTS_UPDATED', prompts: top }).catch(() => {});
    return top;
  } catch (err) {
    console.warn('[Background] Failed to refresh cached prompts:', err);
    return [];
  }
}

// Refresh cache on startup
refreshCachedPrompts().catch(() => {});

// Expose refresh function in module scope for testing (no-op when SW unloads)
export { refreshCachedPrompts };

/**
 * Populate 'Prompt einfügen…' submenu from DB
 */
async function populateInsertPromptsMenu() {
  // Remove existing submenu items under insert-prompt-root
  const children = await new Promise<chrome.contextMenus.ContextMenu[]>(resolve =>
    chrome.contextMenus.removeAll(() => resolve([]))
  );

  // Recreate root and populate
  chrome.contextMenus.create({
    id: 'insert-prompt-root',
    title: 'Prompt einfügen…',
    contexts: ['editable']
  });

  // Insert top favorites + recents
  try {
    // Import DB lazily to avoid loading before it's available
    const { listPrompts } = await import('../db/index');
    const top = await listPrompts({ limit: 10 });
    if (top.length === 0) {
      chrome.contextMenus.create({
        id: 'insert-loading',
        parentId: 'insert-prompt-root',
        title: 'Keine Prompts',
        contexts: ['editable']
      });
    } else {
      for (const p of top) {
        chrome.contextMenus.create({
          id: `insert-prompt-${p.id}`,
          parentId: 'insert-prompt-root',
          title: `${p.favorite ? '⭐ ' : ''}${p.title}`,
          contexts: ['editable']
        });
      }
      chrome.contextMenus.create({
        id: 'insert-more',
        parentId: 'insert-prompt-root',
        title: 'Mehr…',
        contexts: ['editable']
      });
    }
  } catch (err) {
    console.warn('[Background] Failed to populate prompts menu:', err);
  }
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const menuId = String(info.menuItemId);
  console.log('[Background] Context menu clicked:', menuId);
  
  switch (menuId) {
    case 'save-selection':
      handleSaveSelection(info, tab);
      break;
    case 'open-manager':
      handleOpenManager();
      break;
    case 'insert-more':
      // Open popup to show full list
      chrome.action.openPopup();
      break;
    default:
      // Handle prompt insertion (menu items will be dynamically created)
      if (menuId.startsWith('insert-prompt-')) {
        insertPromptFromMenu(info, tab);
      }
      break;
  }
});

/**
 * Handle saving selected text as a prompt
 */
async function handleSaveSelection(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
  if (!tab?.id) return;
  
  const selectedText = info.selectionText || '';
  console.log('[Background] Saving selection as prompt:', selectedText.substring(0, 50) + '...');
  
  // Open popup with prefilled content
  chrome.action.openPopup();
  
  // Send message to popup with selection
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'PREFILL_PROMPT',
      body: selectedText
    }).catch(() => {
      // Popup might not be ready yet, that's okay
      console.log('[Background] Popup not ready for message yet');
    });
  }, 100);
}

/**
 * Handle inserting a prompt into the active field
 */
async function insertPromptFromMenu(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
  if (!tab?.id) return;

  const promptId = String(info.menuItemId).replace('insert-prompt-', '');
  console.log('[Background] Inserting prompt:', promptId);

  try {
    const { getPrompt, incrementUsage } = await import('../db/index');
    const p = await getPrompt(promptId);
    if (!p) throw new Error('Prompt not found');

    // Track usage
    incrementUsage(promptId).catch(() => {});

    chrome.tabs.sendMessage(tab.id as number, {
      type: 'INSERT_PROMPT',
      body: p.body
    }).catch((error) => {
      console.error('[Background] Failed to send message to content script:', error);
    });
  } catch (err) {
    console.error('[Background] Failed to insert prompt from DB:', err);
    // Fallback message
    chrome.tabs.sendMessage(tab?.id as number, {
      type: 'INSERT_PROMPT',
      body: 'Test prompt content - DB integration coming in M1'
    }).catch(() => {});
  }
}

/**
 * Handle opening the prompt manager
 */
function handleOpenManager() {
  console.log('[Background] Opening Prompt Manager');
  chrome.action.openPopup();
}

/**
 * Handle messages from other parts of the extension
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);
  
  switch (message.type) {
    case 'GET_CLIENT_ID':
      chrome.storage.local.get(['clientId'], (result) => {
        sendResponse({ clientId: result.clientId });
      });
      return true; // Keep channel open for async response
      
    case 'REFRESH_MENUS':
      populateInsertPromptsMenu().catch(() => {});
      break;

    case 'DB_UPDATED':
      // Re-populate menus when DB updates
      populateInsertPromptsMenu().catch(() => {});
      // Refresh cached prompts for fast popup startup
      refreshCachedPrompts().catch(() => {});
      break;

    case 'REFRESH_PROMPTS':
      // Request explicit refresh and return results via sendResponse
      (async () => {
        const top = await refreshCachedPrompts();
        sendResponse({ prompts: top });
      })();
      return true; // keep channel open for async response

    default:
      console.log('[Background] Unknown message type:', message.type);
      break;
  }
});

// Keep service worker alive (MV3 best practice for periodic tasks)
// For now, just log that we're active
console.log('[Background] Service worker loaded');

// Mark this file as a module to avoid polluting global scope
export {};
