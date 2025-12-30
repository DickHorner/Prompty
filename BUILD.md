# Build Instructions

## M0 Skeleton - Build & Installation Guide

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)
- Chrome or Chromium-based browser

### Step-by-Step Build Process

#### 1. Clone the Repository
```bash
git clone https://github.com/DickHorner/Prompty.git
cd Prompty
```

#### 2. Install Dependencies
```bash
npm install
```

This will install:
- React & React DOM
- TypeScript
- Vite (build tool)
- Dexie (IndexedDB wrapper)
- ESLint & Prettier
- Testing libraries

#### 3. Build the Extension
```bash
npm run build
```

This creates a `dist/` folder with the compiled extension:
```
dist/
├── background.js          # Service worker
├── content.js             # Content script
├── popup.html             # Popup UI
├── popup.css
├── popup.js
├── options.html           # Options page
├── options.css
├── options.js
├── manifest.json          # Extension manifest
└── icons/                 # Extension icons
    └── icon-128.svg
```

#### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from your project directory
5. The Prompt Manager extension should now appear in your extensions list

### Development Mode

For active development with auto-rebuild:

```bash
npm run dev
```

This runs Vite in watch mode. Changes to source files will automatically trigger a rebuild.

**Important:** After each rebuild, you need to click the reload button on the extension card in `chrome://extensions/` to see the changes.

### Testing the Extension

#### Manual Testing Checklist (M0)

1. **Extension Loads**
   - [ ] No errors in `chrome://extensions/`
   - [ ] Extension icon appears in toolbar

2. **Popup Opens**
   - [ ] Click extension icon
   - [ ] Popup displays with "Prompt Manager" header
   - [ ] Search box is present
   - [ ] Placeholder prompt is visible

3. **Context Menu**
   - [ ] Right-click on any web page
   - [ ] "Prompt einfügen…" menu item appears
   - [ ] "Auswahl als Prompt speichern…" appears (when text is selected)
   - [ ] "Prompt-Manager öffnen" appears

4. **Insert Prompt** (Basic Test)
   - [ ] Navigate to any page with a textarea (e.g., chatgpt.com)
   - [ ] Right-click → "Prompt einfügen…" → select a prompt
   - [ ] Placeholder text should be inserted or copied to clipboard

5. **Options Page**
   - [ ] Click settings icon (⚙️) in popup
   - [ ] Options page opens in new tab
   - [ ] "OneDrive Synchronisation" section visible

### Running Tests

```bash
npm run test
```

Currently includes:
- Vitest configuration
- Test setup file
- (Actual tests will be added in M1)

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Troubleshooting

#### Build Fails
- Make sure you're using Node.js 18+: `node --version`
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check for TypeScript errors: `npm run type-check`

#### Extension Won't Load
- Check for errors in the browser console (F12 in Chrome)
- Verify manifest.json is in the dist/ folder
- Make sure all required files are present in dist/

#### Context Menu Not Appearing
- Check service worker status in `chrome://extensions/` → click "service worker"
- Look for errors in the service worker console
- Try reloading the extension

#### Icons Not Showing
- Currently using SVG placeholders
- For production, convert to PNG (16x16, 48x48, 128x128)
- See `public/icons/README.md` for conversion instructions

### Next Steps (Post-M0)

After verifying M0 works:
1. **M1**: Implement Dexie database and CRUD operations
2. **M2**: Complete context menu integration and insertion logic
3. **M3**: Add hover preview functionality
4. **M4**: Implement OneDrive sync
5. **M5**: Polish and release

### Project Structure Reference

```
Prompty/
├── src/
│   ├── background/
│   │   └── sw.ts              # Service worker
│   ├── content/
│   │   └── content.ts         # Content script
│   ├── ui/
│   │   ├── popup/             # Popup interface
│   │   └── options/           # Options page
│   ├── test/
│   └── manifest.json
├── public/
│   └── icons/
├── docs/
│   ├── plan.md
│   └── agents.md
├── dist/                      # Build output (git-ignored)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Need Help?

- Review [docs/plan.md](docs/plan.md) for architecture details
- Check [docs/agents.md](docs/agents.md) for coding guidelines
- Look at Chrome Extension documentation: https://developer.chrome.com/docs/extensions/mv3/
