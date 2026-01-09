# Prompt Manager Browser Extension

A Manifest V3 browser extension for managing and syncing prompts with Notion. Store your prompts in a Notion database and access them instantly from any text field on the web with local-first caching for offline use.

## Features

- 🔍 **Quick Insert** - Right-click in any text field to insert prompts
- 💾 **Local-First** - IndexedDB caching for instant access and offline use
- 🔄 **Notion Sync** - Keep prompts in Notion as your source of truth
- ⭐ **Favorites** - Mark frequently-used prompts for quick access
- 🏷️ **Tags** - Organize prompts by category
- 👁️ **Hover Preview** - See full content after 200ms hover
- 🔍 **Search** - Instantly search through all prompts
- 📱 **Context Menu** - Insert, sync, and save from right-click menu

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Extension

```bash
npm run build
```

### 3. Load in Browser

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

### 4. Configure Notion

See [USER_GUIDE.md](USER_GUIDE.md) for detailed setup instructions including:
- Creating a Notion integration
- Setting up your database schema
- Configuring the extension

## Current Status: MVP Complete ✓

### Implemented Features
- ✅ Notion API integration with auth
- ✅ Local-first caching (Dexie/IndexedDB)
- ✅ Context menu insertion
- ✅ Popup UI with search
- ✅ Hover preview (200ms)
- ✅ CRUD operations
- ✅ Incremental sync with last-write-wins
- ✅ Rate limit handling
- ✅ Content script for text insertion
- ✅ Service worker orchestration
- ✅ React-based UI
- ✅ TypeScript + Vite build
- ✅ Comprehensive documentation

## Project Structure

```
Prompty/
├── src/
│   ├── background/
│   │   └── sw.ts              # Service worker (context menus, sync, messaging)
│   ├── content/
│   │   └── content.ts         # Content script (text insertion, selection)
│   ├── db/
│   │   ├── index.ts           # Dexie database (prompts, meta)
│   │   └── index.test.ts      # DB tests
│   ├── ui/
│   │   ├── popup/             # Extension popup
│   │   │   ├── Popup.tsx      # Main popup component
│   │   │   ├── main.tsx
│   │   │   ├── popup.html
│   │   │   └── popup.css
│   │   └── options/           # Options page
│   │       ├── main.tsx
│   │       ├── options.html
│   │       └── options.css
│   ├── notion-client.ts       # Notion API wrapper
│   ├── sync.ts                # Sync orchestrator (pull, merge, transform)
│   ├── test/
│   │   └── setup.ts
│   └── manifest.json          # MV3 manifest
├── .github/
│   ├── agents.md              # Development guidelines
│   └── plan.md                # Complete project plan
├── docs/
│   ├── M0-CHECKLIST.md
│   └── M0-SUMMARY.md
├── USER_GUIDE.md              # End-user documentation
├── BUILD.md                   # Build instructions
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

See [BUILD.md](BUILD.md) for detailed build and installation instructions.

**Quick Start:**
```bash
npm install
npm run build
# Load dist/ folder in chrome://extensions/
```

### Development

```bash
# Build in watch mode
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

## Next Steps

### Future Enhancements
- Two-way sync (push local changes to Notion)
- Rich text formatting support
- Bulk import/export
- Advanced search filters
- Keyboard shortcuts
- Multi-language support
- Custom field mappings

## Tech Stack

- **Framework**: React 18.2.0 with TypeScript 5.3.3
- **Build Tool**: Vite 7.3.1 (fast ES module bundler)
- **Extension**: Manifest V3 (service worker, content scripts)
- **Storage**: Dexie.js 4.0.1 (IndexedDB wrapper for local-first caching)
- **API Integration**: Notion API v2022-06-28 (REST with Bearer token auth)
- **Testing**: Vitest + @testing-library/react
- **UI**: CSS with custom styling

## Documentation

- [USER_GUIDE.md](USER_GUIDE.md) - End-user setup and usage instructions
- [BUILD.md](BUILD.md) - Build and development instructions
- [docs/plan.md](docs/plan.md) - Complete project plan and architecture
- [docs/agents.md](docs/agents.md) - Development guidelines and agent instructions

## License

TBD
