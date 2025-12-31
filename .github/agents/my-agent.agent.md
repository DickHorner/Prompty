## Rollen
- **Codex/Copilot**: implementiert Code, Tests, Build, und hält sich an Plan.md.
- **Du (Agent)**: fragst nur nach, wenn eine Entscheidung unblockbar ist. Sonst: best effort + dokumentiere Annahmen.

---

## Grundregeln (Coding)
1. **Extension target: MV3** (Chrome/Chromium zuerst; Firefox optional mit `browser.*` polyfill).
2. **Local-first**: IndexedDB (Dexie) ist primär; Sync ist sekundär.
3. **Keine Platzhalter** im ausgelieferten Code (kein „TODO implement later“ in kritischen Pfaden).
4. **Fehlerbehandlung**: jede Graph-/Auth-Anfrage braucht sauberes Error-Mapping + UI Status.
5. **Konflikte**: ETag + Pull/Merge/Retry implementieren (min. 1 Retry).
6. **Hover Preview**: muss deterministisch mit 500ms Delay funktionieren (Timer cancel on leave).

---

## Tech-Stack Vorgaben (empfohlen)
- TypeScript
- UI: React + Vite **oder** Vanilla + Lit (React ist ok, aber schlank halten)
- DB: Dexie
- UUID: `crypto.randomUUID()` (fallback lib nur wenn nötig)
- Lint/Format: ESLint + Prettier
- Tests: Vitest + jsdom (für merge / UI logic), Playwright optional (später)

---

## Detaillierte Aufgabenliste (auszuführen in Reihenfolge)

### A) Projektgerüst
- `manifest.json` MV3
- Service Worker: `/src/background/sw.ts`
- Content Script: `/src/content/content.ts`
- Popup UI: `/src/ui/popup/*`
- Options UI: `/src/ui/options/*`
- Shared: `/src/shared/*`

### B) Datenbank
- Dexie DB:
  - tables: `prompts`, `meta` (clientId, syncState)
- CRUD APIs:
  - `createPrompt`, `updatePrompt`, `softDeletePrompt`, `listPrompts`, `searchPrompts`
- Migration/SchemaVersion berücksichtigen.

### C) Context Menu
- Root + Submenus wie Plan.md.
- Klick auf Prompt:
  - fetch prompt by id
  - send message to active tab content script: `{ type: "INSERT_PROMPT", body }`
- “Save selection as prompt”:
  - request selection from content script
  - open popup/options create flow with prefilled body

### D) Insertion (Content Script)
- Erkenne:
  - `textarea`, `input[type=text|search|...]`, `[contenteditable=true]`
- Insert at cursor:
  - textarea/input: setRangeText
  - contenteditable: Range/Selection API
- Fallback:
  - copy to clipboard via `navigator.clipboard.writeText` (wenn erlaubt)
  - notify via toast overlay (content script UI)

### E) Popup UI
- Liste + Suche + Favoriten/Zuletzt benutzt
- Hover preview:
  - delay 500ms; cancel on leave
  - anchor near hovered item
- Actions:
  - Insert
  - Edit
  - Delete (soft delete)
  - Sync status indicator

### F) OneDrive Sync (Graph)
- Auth:
  - Implementiere OAuth PKCE flow für Extensions.
  - Tokens in `chrome.storage.local`.
  - Minimal scope: `Files.ReadWrite.AppFolder`.
- Storage:
  - AppFolder: `/drive/special/approot:/PromptManager/prompts.json`
- API wrapper:
  - `graphGet`, `graphPut`, handles 401 refresh, 412 conflict
- Pull/Push:
  - Pull at startup + manual + interval (z. B. 5–15 min, konfigurierbar)
  - Push debounced on local changes
- Merge:
  - last-write-wins per `updatedAt`
  - deleted tombstones honored

### G) Tests
- Unit tests:
  - merge logic (local/remote conflicts, tombstones)
  - prompt CRUD
- Basic integration:
  - insert logic for textarea + contenteditable (jsdom)

### H) Build & Release
- `npm run build` erzeugt `/dist` extension bundle.
- Version bump und changelog optional.

---

## Annahmen, die du treffen darfst (ohne Rückfrage)
- Fokus auf Chromium zuerst.
- Hover preview nur im Popup/Options UI (nicht im nativen OS/Browser context menu).
- OneDrive speichert eine JSON-Datei in AppFolder.
- Konfliktauflösung: last-write-wins nach `updatedAt` ist akzeptabel für v1.

---

## Dinge, die du NICHT tun sollst
- Kein Speichern von Tokens in IndexedDB oder Klartext-Logging.
- Keine Sync-„Magie“ ohne ETag/If-Match.
- Kein blockierendes UI während Sync; stets Status anzeigen.
- Keine Hintergrundschleifen, die den Service Worker wachhalten (MV3 beachten).

---

## Minimaler Done-Check (vor PR)
- Rechtsklick-Menü erscheint + Einfügen funktioniert.
- Auswahl speichern funktioniert.
- Hover preview kommt nach 500ms zuverlässig.
- OneDrive connect + sync push/pull funktioniert.
- Konfliktfall (412) wird abgefangen (pull+merge+retry).
- Tests laufen grün.
