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
    
    // Placeholder submenu items (will be populated dynamically)
    chrome.contextMenus.create({
      id: 'insert-loading',
      parentId: 'insert-prompt-root',
      title: 'Lädt...',
      contexts: ['editable']
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
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('[Background] Context menu clicked:', info.menuItemId);
  
  switch (info.menuItemId) {
    case 'save-selection':
      handleSaveSelection(info, tab);
      break;
    case 'open-manager':
      handleOpenManager();
      break;
    default:
      // Handle prompt insertion (menu items will be dynamically created)
      if (info.menuItemId.startsWith('insert-prompt-')) {
        handleInsertPrompt(info, tab);
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
async function handleInsertPrompt(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
  if (!tab?.id) return;
  
  const promptId = info.menuItemId.replace('insert-prompt-', '');
  console.log('[Background] Inserting prompt:', promptId);
  
  // TODO: Fetch prompt from DB (will be implemented in M1)
  // For now, send a test message
  chrome.tabs.sendMessage(tab.id, {
    type: 'INSERT_PROMPT',
    body: 'Test prompt content - DB integration coming in M1'
  }).catch((error) => {
    console.error('[Background] Failed to send message to content script:', error);
  });
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);
  
  switch (message.type) {
    case 'GET_CLIENT_ID':
      chrome.storage.local.get(['clientId'], (result) => {
        sendResponse({ clientId: result.clientId });
      });
      return true; // Keep channel open for async response
      
    default:
      console.log('[Background] Unknown message type:', message.type);
      break;
  }
});

// Keep service worker alive (MV3 best practice for periodic tasks)
// For now, just log that we're active
console.log('[Background] Service worker loaded');
