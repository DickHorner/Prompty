# Prompt Manager Browser Extension

A browser extension for managing and syncing prompts with OneDrive integration.

## Current Status: M0 - Skeleton Complete ✓

### Implemented Features (M0)
- ✅ MV3 Extension structure
- ✅ Service Worker (background script)
- ✅ Content Script for text insertion
- ✅ React-based Popup UI
- ✅ Options page skeleton
- ✅ Vite + TypeScript build setup
- ✅ ESLint + Prettier configuration
- ✅ Vitest test setup

## Project Structure

```
Prompty/
├── src/
│   ├── background/
│   │   └── sw.ts              # Service worker (context menus, messaging)
│   ├── content/
│   │   └── content.ts         # Content script (text insertion)
│   ├── ui/
│   │   ├── popup/             # Extension popup
│   │   │   ├── Popup.tsx
│   │   │   ├── main.tsx
│   │   │   ├── popup.html
│   │   │   └── popup.css
│   │   └── options/           # Options page
│   │       ├── main.tsx
│   │       ├── options.html
│   │       └── options.css
│   ├── test/
│   │   └── setup.ts
│   └── manifest.json
├── docs/
│   ├── plan.md                # Complete project plan
│   └── agents.md              # Development guidelines
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

## Next Milestones

### M1: Local DB + CRUD UI
- Dexie IndexedDB setup
- Prompt CRUD operations
- Tag system
- Favorites & recently used

### M2: Context Menu + Insert
- Dynamic context menu population
- Text insertion into various input types
- Fallback to clipboard

### M3: Hover Preview (500ms)
- Preview tooltip on hover
- Debounced delay implementation

### M4: OneDrive Sync
- OAuth authentication
- AppFolder file storage
- Pull/Push sync logic
- Conflict resolution

### M5: Polish & Release
- Error handling improvements
- Performance optimization
- Documentation
- Release build

## Tech Stack

- **TypeScript** - Type safety
- **React** - UI framework
- **Vite** - Build tool
- **Dexie** - IndexedDB wrapper (M1+)
- **Microsoft Graph** - OneDrive API (M4+)

## Documentation

See [docs/plan.md](docs/plan.md) for detailed feature specifications and architecture.
See [docs/agents.md](docs/agents.md) for development guidelines.

## License

TBD
