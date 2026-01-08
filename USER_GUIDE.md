# Prompt Manager - User Guide

## Overview

Prompt Manager is a browser extension that lets you store, manage, and quickly insert prompts into any text field on the web. Your prompts are stored in a Notion database and cached locally for fast, offline access.

## Features

- 🔍 **Quick Insert**: Right-click in any text field to insert your favorite prompts
- 💾 **Local-First**: Prompts cached in IndexedDB for instant access and offline use
- 🔄 **Notion Sync**: Keep your prompts in Notion and sync them to the extension
- ⭐ **Favorites**: Mark prompts as favorites for quick access
- 🏷️ **Tags**: Organize prompts with tags
- 👁️ **Hover Preview**: See prompt content after hovering for 200ms
- 🔍 **Search**: Instantly search through all your prompts

---

## Setup

### 1. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give it a name (e.g., "Prompt Manager")
4. Select the workspace where your prompts will be stored
5. Click **"Submit"**
6. Copy the **Internal Integration Token** (starts with `secret_`)

### 2. Create a Notion Database

1. In Notion, create a new database (full page or inline)
2. Add these properties:
   - **Name** (Title) - The prompt title
   - **Body** (Text) - The prompt content
   - **Tags** (Multi-select) - Optional tags
   - **Favorite** (Checkbox) - Mark favorites

3. Share the database with your integration:
   - Click **"..."** menu → **"Add connections"**
   - Select your integration

4. Copy the **Database ID** from the URL:
   ```
   https://notion.so/workspace/DATABASE_ID?v=...
                              ^^^^^^^^^^^^^^^^
   ```

### 3. Configure the Extension

1. Install the extension in your browser
2. Right-click anywhere → **"Prompt-Manager öffnen"**
3. Click the **⚙️ Settings** button
4. Enter:
   - **Notion Token**: Your integration token
   - **Database ID**: Your database ID
   - **Property Mapping** (optional): Customize field names if different
5. Click **"Save"**

### 4. Initial Sync

1. Right-click anywhere → **"Von Notion synchronisieren"**
2. Wait for sync to complete
3. Your prompts are now available!

---

## Usage

### Insert a Prompt

**Method 1: Context Menu**
1. Right-click in any text field (textarea, input, contenteditable)
2. Hover over **"Prompt einfügen…"**
3. Click a prompt from the submenu
4. The prompt is inserted at cursor position

**Method 2: Popup**
1. Click the extension icon or right-click → **"Prompt-Manager öffnen"**
2. Search for a prompt using the search bar
3. Click a prompt to insert it into the last active text field

### Preview a Prompt

In the popup:
1. Hover over any prompt for 200ms
2. A tooltip appears showing the full content
3. Move mouse away to hide the tooltip

### Create a New Prompt

**From Selection:**
1. Select text on any webpage
2. Right-click → **"Auswahl als Prompt speichern…"**
3. The popup opens with the selected text pre-filled
4. Edit and save

**From Popup:**
1. Open the popup
2. Click **"+ Neuer Prompt"**
3. Enter title, body, and tags
4. Save (creates in local cache - will sync to Notion on next sync)

### Edit a Prompt

1. Open the popup
2. Find the prompt
3. Click the **✏️ Edit** button
4. Modify title or body
5. Changes are saved locally

### Delete a Prompt

1. Open the popup
2. Find the prompt
3. Click the **🗑️ Delete** button
4. Confirm deletion
5. Prompt is soft-deleted (marked as deleted, not shown in list)

### Sync with Notion

**Manual Sync:**
- Right-click → **"Von Notion synchronisieren"**

**Automatic Sync:**
- On extension startup
- (Optional: Set up periodic sync in Options)

**How Sync Works:**
- Pulls new/updated prompts from Notion
- Uses last-write-wins strategy (most recent `updatedAt` wins)
- Incremental: only fetches pages edited since last sync
- Safe: never overwrites newer local changes

---

## Advanced Features

### Property Mapping

If your Notion database uses different field names, configure the mapping in Options:

```json
{
  "title": "Prompt Title",
  "body": "Content",
  "tags": "Categories",
  "favorite": "Star"
}
```

### Keyboard Shortcuts (Future)

- `Ctrl+Shift+P`: Open Prompt Manager
- `Ctrl+Shift+S`: Sync from Notion

### Search Tips

- Search matches title, body, and tags
- Searches are case-insensitive
- Use specific keywords for better results

---

## Troubleshooting

### "Notion API unauthorized (401)"

**Cause**: Invalid or missing token

**Fix**:
1. Open Options
2. Verify your token is correct (starts with `secret_`)
3. Make sure the integration has access to your database
4. Re-save the configuration

### "Notion API rate limited (429)"

**Cause**: Too many API calls in a short period

**Fix**:
- Wait 1 minute
- Try syncing again
- The extension automatically adds delays between batch requests

### "Keine Prompts" (No Prompts)

**Cause**: Database empty or not synced yet

**Fix**:
1. Check your Notion database has pages
2. Run manual sync: Right-click → "Von Notion synchronisieren"
3. Check browser console for errors (F12 → Console)

### Prompts Not Inserting

**Cause**: Content script not loaded or permission issue

**Fix**:
1. Refresh the webpage
2. Check if the page allows content scripts
3. Try on a different website
4. Check extension permissions in browser settings

### Hover Preview Not Showing

**Cause**: Moved mouse away too quickly

**Fix**:
- Keep mouse over prompt for at least 200ms
- Tooltip appears slightly below the prompt item

---

## Data & Privacy

### Where is Data Stored?

- **Notion**: Your source of truth - all prompts stored in your Notion workspace
- **Local Cache**: IndexedDB in your browser for fast access and offline use
- **No Cloud Storage**: Extension never sends data to third-party servers

### What is Synced?

- Prompt title, body, tags, and favorite status
- Created and updated timestamps
- Usage statistics (count, last used)

### What is NOT Synced?

- Notion token (stored only in `chrome.storage.local`)
- Usage statistics (local only)
- Deleted prompts remain in local cache with `deleted` flag

---

## Notion Database Schema

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Prompt title (displayed in menus) |
| Body | Text | Full prompt content |

### Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| Tags | Multi-select | Organize prompts by category |
| Favorite | Checkbox | Mark for quick access |
| Source | Select | Origin context (e.g., "work", "personal") |
| Deleted | Checkbox | Soft-delete flag (optional) |

### Auto-Tracked Fields

The extension automatically uses these Notion system fields:

- `created_time`: When the page was created
- `last_edited_time`: When the page was last modified (used for incremental sync)

---

## Tips & Best Practices

### Organization

1. **Use Tags**: Group related prompts (`coding`, `email`, `writing`)
2. **Mark Favorites**: Star frequently-used prompts for quick access
3. **Descriptive Titles**: Use clear, searchable titles
4. **Keep It Short**: Long prompts work better in Notion; use links for context

### Performance

1. **Sync Regularly**: Keep local cache up-to-date
2. **Limit Database Size**: 100-500 prompts recommended for best performance
3. **Use Search**: Faster than scrolling through long lists

### Workflow

1. **Collect in Notion**: Add new prompts to your Notion database throughout the day
2. **Sync Once**: Run manual sync at start of work session
3. **Use Offline**: All prompts available without internet connection
4. **Review Weekly**: Clean up unused prompts, update outdated ones

---

## Keyboard & Mouse Reference

### Context Menu (Right-Click)

- **In text field**: "Prompt einfügen…" → Insert prompt
- **On selected text**: "Auswahl als Prompt speichern…" → Save selection
- **Anywhere**: "Prompt-Manager öffnen" → Open popup
- **Anywhere**: "Von Notion synchronisieren" → Manual sync

### Popup

- **Search bar**: Type to filter prompts
- **Prompt item**: Click to insert
- **Hover 200ms**: Show preview tooltip
- **✏️ button**: Edit prompt
- **🗑️ button**: Delete prompt
- **⚙️ icon**: Open settings

---

## Support & Feedback

### Reporting Issues

1. Check browser console (F12 → Console) for errors
2. Note the extension version (from manifest or about page)
3. Describe steps to reproduce
4. Include relevant error messages

### Feature Requests

Future features planned:
- OAuth authentication (instead of internal integration)
- Push to Notion (create/update from extension)
- Keyboard shortcuts
- Custom context menu ordering
- Export/import backup
- Multi-database support

---

## Version History

### v0.1.0 (Current)
- ✅ Notion API integration
- ✅ Local-first caching (IndexedDB)
- ✅ Context menu insertion
- ✅ Popup UI with search
- ✅ Hover preview (200ms)
- ✅ CRUD operations
- ✅ Incremental sync
- ✅ Rate limit handling

---

## License

[Add your license here]

## Credits

Built with:
- Vite
- React
- TypeScript
- Dexie (IndexedDB wrapper)
- Notion API
