/**
 * Service Worker (Background Script) for Prompt Manager Extension
 * MV3 compatible - handles context menus, messaging, Notion sync
 */


import { syncWithNotion } from '../sync';

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
    chrome.contextMenus.create({
      id: 'insert-loading',
      parentId: 'insert-prompt-root',
      title: 'Lädt...',
      contexts: ['editable']
    });

    // Attempt to populate with prompts from DB
    populateInsertPromptsMenu().catch(() => {
      // Swallow errors until DB is fully integrated
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

    // Sync prompts from Notion
    chrome.contextMenus.create({
      id: 'sync-notion',
      title: 'Von Notion synchronisieren',
      contexts: ['all']
    });

    // Sync prompts from Notion
    chrome.contextMenus.create({
      id: 'sync-notion',
      title: 'Von Notion synchronisieren',
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

// Export for testing
export { refreshCachedPrompts };

/**
 * Populate 'Prompt einfügen…' submenu from DB
 */
async function populateInsertPromptsMenu() {
  // Remove and recreate root menu
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'insert-prompt-root',
      title: 'Prompt einfügen…',
      contexts: ['editable']
    });
  });

  // Insert top favorites + recents
  try {
    const { listPrompts } = await import('../db/index');
    const top = await listPrompts({ limit: 10 });
    if (top.length === 0) {
      chrome.contextMenus.create({
        id: 'insert-empty',
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
    case 'sync-notion':
      handleSyncFromNotion();
      break;
    case 'insert-more':
      chrome.action.openPopup();
      break;
    default:
      if (menuId.startsWith('insert-prompt-')) {
        insertPromptFromMenu(info, tab);
      }
      break;
  }
});

/**
 * Handle saving selected text as a prompt
 */
async function handleSaveSelection(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  if (!tab?.id) return;

  const selectedText = info.selectionText || '';
  console.log('[Background] Saving selection as prompt:', selectedText.substring(0, 50) + '...');

  chrome.action.openPopup();

  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'PREFILL_PROMPT',
      body: selectedText
    }).catch(() => {
      console.log('[Background] Popup not ready for message yet');
    });
  }, 100);
}

/**
 * Handle inserting a prompt into the active field
 */
async function insertPromptFromMenu(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
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
 * Handle sync from Notion
 */
async function handleSyncFromNotion() {
  console.log('[Background] Starting manual Notion sync...');

  try {
    // Get token and config from storage
    const storage = await chrome.storage.local.get(['notionToken', 'notionDatabaseId', 'notionPropertyMap']);
    const token = storage.notionToken;
    const databaseId = storage.notionDatabaseId;
    const propertyMap = storage.notionPropertyMap || {
      title: 'Name',
      body: 'Body',
      tags: 'Tags',
      favorite: 'Favorite'
    };

    if (!token || !databaseId) {
      console.warn('[Background] Notion config incomplete. Opening settings...');
      chrome.runtime.openOptionsPage();
      return;
    }

    const result = await syncWithNotion(
      { notionToken: token, notionDatabaseId: databaseId },
      propertyMap
    );

    console.log(`[Background] Sync complete: merged ${result.merged} prompts`);

    // Refresh cached prompts and menus
    await refreshCachedPrompts();
    await populateInsertPromptsMenu();

    // Notify UI
    chrome.runtime.sendMessage({
      type: 'SYNC_COMPLETE',
      merged: result.merged
    }).catch(() => {});
  } catch (err) {
    console.error('[Background] Sync failed:', err);
  }
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
      return true;

    case 'REFRESH_MENUS':
      populateInsertPromptsMenu().catch(() => {});
      break;

    case 'DB_UPDATED':
      populateInsertPromptsMenu().catch(() => {});
      refreshCachedPrompts().catch(() => {});
      break;

    case 'REFRESH_PROMPTS':
      (async () => {
        const top = await refreshCachedPrompts();
        sendResponse({ prompts: top });
      })();
      return true;

    case 'SET_NOTION_CONFIG':
      (async () => {
        await chrome.storage.local.set({
          notionToken: message.notionToken,
          notionDatabaseId: message.notionDatabaseId,
          notionPropertyMap: message.notionPropertyMap
        });
        sendResponse({ success: true });
      })();
      return true;

    case 'GET_NOTION_CONFIG':
      chrome.storage.local.get(['notionDatabaseId', 'notionPropertyMap'], (result) => {
        sendResponse({
          notionDatabaseId: result.notionDatabaseId,
          notionPropertyMap: result.notionPropertyMap
        });
      });
      return true;

    default:
      console.log('[Background] Unknown message type:', message.type);
      break;
  }
});

console.log('[Background] Service worker loaded');

export {};

