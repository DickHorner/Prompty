# Prompt Manager — Plan.md (Notion als DB, ohne Proxy)

## Ziel
Eine Browser-Extension (Manifest V3), die Prompts **aus einer Notion-Datenbank** bezieht, lokal cached (IndexedDB) und per Rechtsklick nutzbar macht. In der UI gibt es eine Vorschau, die **nach 200 ms Hover** erscheint.

---

## Leitidee (praktikabel ohne Server)
- **Notion ist Source of Truth** (Pflege der Prompts in Notion).
- Die Extension ist **local-first**:
  - schneller Zugriff aus Cache (IndexedDB)
  - offline nutzbar mit letztem Stand
- **Notion API Calls laufen im Extension-Kontext** (Service Worker / Extension Pages), nicht im Content Script → CORS-Probleme der Website werden umgangen.
- Auth via **Notion Internal Integration Token** (MVP), später optional OAuth.

---

## Kernfunktionen (MVP)
1. **Rechtsklick-Menü**
   - „Prompt einfügen …“ (Favoriten + zuletzt genutzt + Top N)
   - „Mehr…“ (öffnet Popup mit Suche + kompletter Liste)
   - „Auswahl als Prompt speichern …“ (nur bei markiertem Text)
   - „Prompt-Manager öffnen“ (Options/Manager)
2. **Prompt einfügen**
   - in `textarea`, `input`, `contenteditable`
   - Fallback: Clipboard + Toast
3. **Hover-Preview (200 ms)**
   - In Popup/Options UI (nicht im nativen Browser-Context-Menu)
   - `mouseenter` → Timer **200 ms**
   - `mouseleave` → Timer cancel + Preview schließen
4. **Notion Sync → Cache**
   - Pull beim Start + regelmäßig (z. B. alle 10–30 Minuten) + manuell
   - Inkrementell über `last_edited_time` (Filter/Sort) + Pagination
   - Merge in IndexedDB (last-write-wins nach `updatedAt`)

---

## Notion-Datenbank Schema (Vorschlag)
Pflichtfelder:
- **Name** (title) → Prompt-Titel
- **Body** (rich_text) → Prompt-Inhalt

Optional:
- **Tags** (multi_select)
- **Favorite** (checkbox)
- **Deleted** (checkbox) (für Tombstones/Soft-Delete, optional)
- **Source** (select) (z. B. „system“, „school“, „legal“)

Mapping:
- `title` ← Name
- `body` ← Body (rich_text zusammenfügen)
- `tags` ← Tags
- `favorite` ← Favorite
- `updatedAt` ← Notion `last_edited_time`
- `id` ← Notion page_id (stabil, ideal als Primärschlüssel)

---

## Datenmodell (lokal in IndexedDB)

### Prompt
```ts
{
  id: string,            // notion page_id
  title: string,
  body: string,
  tags: string[],
  favorite: boolean,
  createdAt: number,     // aus Notion created_time (optional) oder 최초 gesehen
  updatedAt: number,     // notion last_edited_time (ms epoch)
  usageCount: number,
  lastUsedAt?: number,
  deleted?: boolean
}
```

### Meta / SyncState
```ts
{
  clientId: string,
  notion: {
    databaseId: string,
    lastSyncAt?: number,
    lastSyncCursor?: string,   // optional (Pagination/Checkpoint)
    lastSyncEditedTime?: number // optional (für incremental pulls)
  }
}
```

---

## Sync-Strategie (MVP)

### Pull (Startup + manuell + Intervall)
1. Query Notion DB:
   - Sort: `last_edited_time` descending
   - Optional Filter: `last_edited_time > lastSyncEditedTime`
   - Pagination via `start_cursor`/`has_more`
2. Transform Notion pages → lokale Prompt-Objekte
3. Merge remote → local:
   - wenn lokal fehlt → add
   - wenn remote `updatedAt` > local `updatedAt` → overwrite local
   - wenn remote marked deleted → local.deleted = true
4. Update `lastSyncEditedTime` und `lastSyncAt`

### Push (optional, v1)
MVP kann **read-only** aus Notion sein (Notion als Editor). Wenn „Speichern“ aus Browser gefordert ist:
- Create/Update Notion Page via API (Service Worker)
- Soft-delete via `Deleted=true` oder page archival (vorsichtig)

---

## Architektur

### Background (Service Worker, MV3)
- Registriert contextMenus
- Notion API Client (fetch wrapper)
- Sync Orchestrator (Pull → Merge → Cache)
- Message Router:
  - `GET_PROMPTS`
  - `SEARCH_PROMPTS`
  - `INSERT_PROMPT`
  - `SAVE_PROMPT_FROM_SELECTION`

### Content Script
- Ermittelt aktives Eingabefeld
- Insert an Cursorposition
- Kann Selection auslesen (für „Auswahl speichern“)

### Popup/Options UI
- Liste + Suche
- Hover-Preview **200 ms**
- CRUD (optional)
- Sync-Status (zuletzt aktualisiert)

---

## Manifest / Permissions (Hinweise)
- `host_permissions`: `https://api.notion.com/*`
- `permissions`: `contextMenus`, `storage`, `scripting`, `activeTab`
- Keine Tokens im Klartext loggen

---

## Meilensteine
1. Skeleton (MV3 + Popup + SW + Content Script)
2. Dexie Cache + UI Liste
3. Context Menu + Insert
4. Hover-Preview (200 ms)
5. Notion Pull Sync (DB Query + Merge)
6. „Auswahl speichern“ (optional: Notion Create Page)

---

## Definition of Done (MVP)
- Prompts werden aus Notion DB geladen und lokal gecached.
- Rechtsklick → Prompt einfügen funktioniert in gängigen Inputs.
- Hover-Preview erscheint nach **200 ms** zuverlässig im Popup/Options UI.
- Sync ist stabil, UI bleibt reaktiv, keine Token-Leaks.
