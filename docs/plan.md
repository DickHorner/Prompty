# Plan.md — Prompt Manager (Browser Extension, MV3) + OneDrive Sync

## 0) Zielbild (1 Satz)
Ein Prompt-Manager als Browser-Extension mit Rechtsklick-Menü zum Einfügen/Speichern von Prompts, inkl. Hover-Preview nach 500ms, und synchroner Prompt-Datenbank über OneDrive (Microsoft Graph), sodass mehrere Browser-Instanzen denselben Bestand nutzen.

---

## 1) Kern-Features (MVP → v1)

### MVP (funktional, schnell nutzbar)
1. **Context Menu (Rechtsklick)**:
   - Menüpunkt: „Prompt einfügen…“ → Untermenü mit Prompt-Liste (Top N + Suche via Popup).
   - Menüpunkt: „Auswahl als Prompt speichern…“ (wenn Text markiert).
   - Menüpunkt: „Prompt-Manager öffnen“ (Popup/Options).
2. **Prompt einfügen**:
   - In aktive Textarea/ContentEditable einfügen (ChatGPT, Notion, Gmail, etc.).
   - Fallback: in Zwischenablage kopieren, wenn Einfügen nicht möglich.
3. **Hover-Preview**:
   - Wenn Nutzer im Kontextmenü/Popup über einem Prompt-Eintrag hovert:
   - **nach 500ms** erscheint ein kleines Vorschaufenster (Snippet + Metadaten).
4. **Lokale DB**:
   - IndexedDB (via Dexie) als Primärspeicher.
   - Schema für Prompts + Tags + zuletzt benutzt + Favoriten.
5. **OneDrive Sync (einfach, robust)**
   - Prompts werden als **eine Datei** (z. B. `PromptManager/prompts.json`) in OneDrive abgelegt.
   - Sync-Strategie: Pull on startup + Push on change (debounced), Konflikte über `updatedAt` + `clientId`.

### v1 (Qualität + Komfort)
- Volltextsuche (clientseitig), Tags, Favoriten, “Zuletzt benutzt”
- Templates/Variablen (z. B. `{{name}}`, `{{date}}`) + kleines “Fill Form”
- Import/Export (JSON), Backup, Versionsverlauf (optional)
- Optional: Delta-Sync (Graph `delta`), oder Aufteilung in mehrere Dateien, wenn die Datei zu groß wird.

---

## 2) Technische Leitentscheidungen

### 2.1 Extension statt Userscript
- **Context Menus** sind in MV3 sauber.
- Content Script kann zuverlässig in Inputs einfügen, Preview-UI rendern.
- OneDrive OAuth ist in Extension standardisiert (Chrome Identity / OAuth PKCE).

### 2.2 Datenhaltung
- Local-first: IndexedDB ist Truth für UI-Performance.
- OneDrive ist Sync-Backend (Quelle der Wahrheit nur für Abgleich).
- Konfliktlösung: last-write-wins pro Prompt + Merge auf Feldbasis optional.

### 2.3 OneDrive / Microsoft Graph
- Auth: OAuth 2.0 mit MS Identity Platform (PKCE).
- Scope minimal: `Files.ReadWrite.AppFolder` (bevorzugt) oder `Files.ReadWrite` (wenn AppFolder nicht reicht).
- Speicherort bevorzugt: **AppFolder** (`/drive/special/approot:`) → keine Dateisuche überall.
- Datei: `prompts.json` im AppFolder.
- Optional später: Graph delta queries für effizientere Syncs.

---

## 3) UX / Interaktionsdetails

### 3.1 Rechtsklick-Menü
- Root:
  - „Prompt einfügen…“ (untermenü)
  - „Auswahl als Prompt speichern…“ (nur wenn selection vorhanden)
  - „Prompt-Manager öffnen“
- Untermenü-Items:
  - Favoriten oben
  - Dann „Zuletzt benutzt“
  - Dann Top 15 alphabetisch
  - „Mehr…“ öffnet Popup mit Suche + kompletter Liste

### 3.2 Hover-Preview (500ms)
- Gilt im Popup/Options UI (nicht im nativen Browser-Context-Menu, weil dort Hover-Events nicht zugänglich sind).
- Implementierung:
  - `mouseenter` auf Listeneintrag → `setTimeout(500ms)` → Preview Tooltip Panel zeigen.
  - `mouseleave` → Timeout abbrechen + Preview schließen.
- Vorschaufenster:
  - Title, Tags, 1–2 Zeilen Snippet (monospace optional), updatedAt
  - “Einfügen” Button, “Bearbeiten” Button

### 3.3 Prompt speichern
- Wenn Text markiert: speichere selection als Prompt (Titel wird abgefragt; Default aus erstem Satz).
- Sonst: Popup „Neuer Prompt“ (Titel, Inhalt, Tags)

---

## 4) Datenmodell (v1)

### Prompt
- `id: string` (uuid)
- `title: string`
- `body: string`
- `tags: string[]`
- `favorite: boolean`
- `createdAt: number` (ms epoch)
- `updatedAt: number`
- `usageCount: number`
- `lastUsedAt?: number`
- `deleted?: boolean` (tombstone für sync)

### Client / Sync
- `clientId: string` (einmalig pro Browser-Install)
- `syncState`:
  - `lastPulledAt`
  - `oneDriveFileETag` (für optimistic concurrency)
  - `lastPushedHash` (optional)
- Sync-File Format `prompts.json`:
  - `{ schemaVersion, updatedAt, prompts: Prompt[], tombstones?: string[] }`

---

## 5) Architektur / Komponenten

### Hintergrund (Service Worker, MV3)
- Registriert contextMenus
- Handhabt Klicks:
  - „einfügen“ → message an Content Script mit Prompt-Body
  - „speichern“ → message an Popup/Options (oder direkt DB write)
- Sync Orchestrator (OneDrive):
  - login, token refresh
  - pull/push
  - conflict merge

### Content Script
- Findet aktives Input (textarea, input, contenteditable)
- Insert:
  - Einfügen an Cursorposition
  - Wenn nicht möglich: Clipboard schreiben + Toast „in Zwischenablage“

### Popup UI (React oder Vanilla)
- Suche, Liste, Preview on hover 500ms
- CRUD: create/edit/delete
- Sync Status: “zuletzt synchronisiert …”

### Options Page
- OneDrive verbinden / trennen
- Export/Import
- Advanced: Sync Intervall, AppFolder vs Pfad

---

## 6) Sync-Algorithmus (MVP)

### Pull (Startup + manuell + alle X Minuten)
1. Lade `prompts.json` aus AppFolder.
2. Wenn nicht vorhanden → initialisiere Datei mit lokalem Bestand oder leer.
3. Merge remote → local:
   - Für jede Prompt-ID:
     - wenn lokal fehlt → add
     - wenn remote fehlt und lokal vorhanden → behalten (push später)
     - wenn beide vorhanden:
       - wenn `updatedAt` remote > local → overwrite local
       - sonst local bleibt
   - Tombstones: wenn remote `deleted`/tombstone neuer → local tombstone setzen
4. Speichere `ETag`.

### Push (auf lokaler Änderung, debounced 2–5s)
1. Erzeuge remote payload aus local (inkl. tombstones).
2. PUT/Upload mit `If-Match: <ETag>` (wenn vorhanden).
3. Wenn 412 Precondition Failed:
   - Pull + Merge + retry push (max 1–2 retries).

---

## 7) Sicherheit & Datenschutz
- Tokens niemals in Logs.
- Token speichern:
  - prefer `chrome.storage.local` (oder `browser.storage.local` in Firefox)
  - kurzlebig + refresh token falls erlaubt.
- Scope minimal.
- Keine Telemetrie im MVP.

---

## 8) Teststrategie (minimum viable)
- Unit: merge logic, schema migrations
- Integration: insert into textarea/contenteditable (mock DOM)
- Manual test checklist:
  - Rechtsklick → Menü erscheint
  - Einfügen in ChatGPT textbox
  - Auswahl speichern
  - Hover preview nach 500ms
  - OneDrive: connect → pull/push, konfliktfall (2 Browser)

---

## 9) Repo-Struktur (Vorschlag)
- `/extension`
  - `/src/background`
  - `/src/content`
  - `/src/ui` (popup + options)
  - `/src/db`
  - `/src/sync`
  - `manifest.json`
- `/docs`
  - `Plan.md` (dieses Dokument)
  - `agents.md`
  - `privacy.md` (später)
- `README.md`

---

## 10) Milestones
1. M0: Skeleton Extension (manifest, SW, popup)
2. M1: Local DB + CRUD UI
3. M2: Context Menu + Insert via content script
4. M3: Hover Preview (500ms) in UI
5. M4: OneDrive Auth + AppFolder file + Pull/Push
6. M5: Konflikt-Handling + polish + release build

---

## 11) Definition of Done (v1)
- Prompts können erstellt/editiert/gelöscht werden.
- Rechtsklick → Prompt einfügen funktioniert in gängigen Inputs.
- Hover-Preview erscheint nach 500ms zuverlässig.
- OneDrive Sync verbindet, synchronisiert, und übersteht Konflikte.
- Kein Klartext-Token in Logs, keine Crashloops im Service Worker.
md
Code kopieren
