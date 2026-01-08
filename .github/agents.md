# Prompt Manager — agents.md (Notion-DB, ohne Proxy)

## Auftrag
Implementiere die Browser-Extension gemäß Plan.md:
- Notion ist die Prompt-Datenbank (Source of Truth).
- Extension cached lokal (IndexedDB/Dexie) und stellt Prompts per Rechtsklick bereit.
- Hover-Preview erscheint nach **200 ms**.

---

## Tech-Stack Vorgaben
- Manifest V3
- TypeScript
- Dexie (IndexedDB)
- UI: React + Vite ODER Vanilla (schlank)
- Tests: Vitest (mindestens Merge/Transform)

---

## Verbindliche Regeln
1. **Notion API Calls nur im Extension-Kontext** (Service Worker / Extension Pages), nicht im Content Script.
2. **Hover-Preview Delay exakt 200 ms**:
   - `mouseenter` → `setTimeout(200)`
   - `mouseleave` → `clearTimeout` + hide
3. Local-first UX: Rechtsklick-Menü und Suche müssen aus Cache schnell sein.
4. Token-Sicherheit:
   - Token in `chrome.storage.local`
   - niemals loggen
   - niemals in DOM rendern
5. Fehlerbehandlung:
   - 429 Rate Limit: backoff + retry
   - 401: Token fehlt/invalid → UI fordert neu an
6. Keine Dauerloops, die MV3 Service Worker künstlich wach halten.

---

## Aufgabenabfolge

### A) Projektgerüst
- `manifest.json` (MV3) mit:
  - permissions: contextMenus, storage, scripting, activeTab
  - host_permissions: https://api.notion.com/*
- Service Worker: contextMenus + messaging + notion client
- Content Script: insert + selection
- Popup/Options UI: list + search + hover preview

### B) Datenbank (Dexie)
- Tables: `prompts`, `meta`
- Indizes: `title`, `tags`, `favorite`, `updatedAt`, `lastUsedAt`
- CRUD + soft-delete

### C) Notion Client
- Wrapper um fetch:
  - default headers: Authorization, Notion-Version, Content-Type
  - typed responses + error mapping
- Implementiere:
  - `queryDatabase(databaseId, filter?, sorts?, cursor?)`
  - `pageToPrompt(page)` transformer

### D) Sync Pull
- On startup + interval + manual
- Query Notion:
  - sort by last_edited_time desc
  - optional filter last_edited_time > lastSyncEditedTime
- Merge in Dexie (last-write-wins nach updatedAt)

### E) Kontextmenü + Insert
- Root:
  - Prompt einfügen… (top entries)
  - Mehr… (Popup)
  - Auswahl speichern… (nur wenn selection)
- Klick: Prompt aus Dexie holen → message to content script → insert

### F) Hover Preview (200 ms) in UI
- Preview Panel anchored near hovered row
- Cancel timer on leave
- Show snippet + tags + updatedAt
- Aktionen: Insert / Edit (optional)

### G) Tests
- `pageToPrompt` transformer
- Merge logic (updatedAt comparisons, deleted flag)
- Insert logic (textarea + contenteditable)

---

## Erlaubte Annahmen (ohne Rückfrage)
- MVP nutzt Internal Integration Token (kein OAuth).
- Notion page_id ist Prompt-ID.
- Hover-Preview nur im Popup/Options UI (nicht im nativen Browser-Kontextmenü).

---

## Abschluss-Check
- Notion DB wird abgefragt, Daten landen im Cache.
- Rechtsklick-Menü funktioniert, Insert klappt.
- Hover-Preview erscheint nach **200 ms**.
- Rate limits/Errors werden sauber behandelt.
- Keine Token-Leaks, keine Crashloops.
