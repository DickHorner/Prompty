/**
 * Content Script for Prompt Manager Extension
 * Handles inserting prompts into active input fields
 */

console.log('[Content] Prompt Manager content script loaded');

/**
 * Find the currently active/focused input element
 */
function findActiveInput(): HTMLElement | null {
  const activeElement = document.activeElement;
  
  // Check if it's a valid input element
  if (
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLInputElement ||
    (activeElement instanceof HTMLElement && activeElement.isContentEditable)
  ) {
    return activeElement as HTMLElement;
  }
  
  return null;
}

/**
 * Insert text into a textarea or input element
 */
function insertIntoInput(element: HTMLTextAreaElement | HTMLInputElement, text: string): boolean {
  try {
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    
    // Use setRangeText for better support
    if ('setRangeText' in element) {
      element.setRangeText(text, start, end, 'end');
      
      // Trigger input event for frameworks like React
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      return true;
    }
    
    // Fallback: manual insertion
    const value = element.value;
    element.value = value.substring(0, start) + text + value.substring(end);
    element.selectionStart = element.selectionEnd = start + text.length;
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  } catch (error) {
    console.error('[Content] Failed to insert into input:', error);
    return false;
  }
}

/**
 * Insert text into a contenteditable element
 */
function insertIntoContentEditable(element: HTMLElement, text: string): boolean {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // No selection, append at the end
      element.textContent += text;
      return true;
    }
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    // Move cursor after inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Trigger input event
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    return true;
  } catch (error) {
    console.error('[Content] Failed to insert into contenteditable:', error);
    return false;
  }
}

/**
 * Copy text to clipboard (fallback)
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('[Content] Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Show a temporary toast notification
 */
function showToast(message: string, duration: number = 3000) {
  // Create toast element
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(toast);
  
  // Remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 300);
  }, duration);
}

/**
 * Handle inserting a prompt
 */
async function handleInsertPrompt(body: string) {
  console.log('[Content] Inserting prompt:', body.substring(0, 50) + '...');
  
  const activeInput = findActiveInput();
  
  if (!activeInput) {
    // No active input, try clipboard
    const copied = await copyToClipboard(body);
    if (copied) {
      showToast('✓ Prompt in Zwischenablage kopiert');
    } else {
      showToast('✗ Fehler beim Kopieren');
    }
    return;
  }
  
  // Try to insert based on element type
  let success = false;
  
  if (activeInput instanceof HTMLTextAreaElement || activeInput instanceof HTMLInputElement) {
    success = insertIntoInput(activeInput, body);
  } else if (activeInput.isContentEditable) {
    success = insertIntoContentEditable(activeInput, body);
  }
  
  if (success) {
    showToast('✓ Prompt eingefügt');
  } else {
    // Fallback to clipboard
    const copied = await copyToClipboard(body);
    if (copied) {
      showToast('✓ Prompt in Zwischenablage kopiert');
    } else {
      showToast('✗ Fehler beim Einfügen');
    }
  }
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content] Received message:', message.type);
  
  switch (message.type) {
    case 'INSERT_PROMPT':
      handleInsertPrompt(message.body);
      sendResponse({ success: true });
      break;
      
    case 'GET_SELECTION':
      const selection = window.getSelection()?.toString() || '';
      sendResponse({ selection });
      break;
      
    default:
      console.log('[Content] Unknown message type:', message.type);
      break;
  }
  
  return true; // Keep channel open for async responses
});
