# M0 Verification Checklist

## Pre-Flight Check ✈️

Use this checklist to verify M0 is complete and ready for handoff/deployment.

---

## 1. Project Files ✅

- [x] package.json exists with correct dependencies
- [x] tsconfig.json configured properly
- [x] vite.config.ts with multi-entry setup
- [x] .gitignore includes dist/, node_modules/
- [x] ESLint + Prettier configured
- [x] Vitest configured

## 2. Source Code Structure ✅

### Core Files
- [x] src/manifest.json (MV3 compliant)
- [x] src/background/sw.ts (service worker)
- [x] src/content/content.ts (content script)

### UI Components
- [x] src/ui/popup/Popup.tsx
- [x] src/ui/popup/main.tsx
- [x] src/ui/popup/popup.html
- [x] src/ui/popup/popup.css
- [x] src/ui/options/main.tsx
- [x] src/ui/options/options.html
- [x] src/ui/options/options.css

### Testing
- [x] src/test/setup.ts

### Assets
- [x] public/icons/ directory created
- [x] Icon placeholder (SVG) provided

## 3. Documentation ✅

- [x] README.md (project overview)
- [x] BUILD.md (detailed build instructions)
- [x] QUICKSTART.md (3-minute setup guide)
- [x] docs/plan.md (complete specification)
- [x] docs/agents.md (dev guidelines)
- [x] docs/M0-SUMMARY.md (milestone summary)

## 4. Code Quality ✅

Run these checks:

```bash
# Type checking
npm run type-check
# Should output: No errors

# Linting
npm run lint
# Should output: No errors

# Build
npm run build
# Should complete without errors
```

- [x] Zero TypeScript errors
- [x] Zero ESLint errors
- [x] Build completes successfully

## 5. Functionality Tests 🧪

### Build Test
```bash
npm install
npm run build
```
- [ ] Dependencies install without errors
- [ ] Build creates dist/ folder
- [ ] dist/ contains all required files:
  - [ ] manifest.json
  - [ ] background.js
  - [ ] content.js
  - [ ] popup.html, popup.css, popup.js
  - [ ] options.html, options.css, options.js
  - [ ] icons/ folder

### Extension Loading Test
1. [ ] Open chrome://extensions/
2. [ ] Enable Developer mode
3. [ ] Load unpacked → select dist/
4. [ ] Extension appears without errors
5. [ ] No errors in extension service worker console

### Popup Test
1. [ ] Click extension icon
2. [ ] Popup opens (400x600px window)
3. [ ] Header shows "Prompt Manager"
4. [ ] Search box is present and focusable
5. [ ] Placeholder prompt displays
6. [ ] Settings button (⚙️) is visible
7. [ ] Click settings → options page opens
8. [ ] Sync status shows "Not synced"

### Context Menu Test
1. [ ] Right-click on any webpage
2. [ ] "Prompt einfügen…" menu item appears
3. [ ] Select text on page
4. [ ] Right-click selected text
5. [ ] "Auswahl als Prompt speichern…" appears
6. [ ] "Prompt-Manager öffnen" appears in all contexts

### Insertion Test
1. [ ] Navigate to site with textarea (e.g., chatgpt.com)
2. [ ] Focus on textarea
3. [ ] Right-click → "Prompt einfügen…" → select prompt
4. [ ] Text is inserted OR copied to clipboard
5. [ ] Toast notification appears

### Options Page Test
1. [ ] Open options (via settings button or right-click menu)
2. [ ] Page loads in new tab
3. [ ] "OneDrive Synchronisation" section visible
4. [ ] "Import/Export" section visible
5. [ ] "About" section shows version 0.1.0

## 6. Browser Console Tests 🔍

### Service Worker Console
1. [ ] Go to chrome://extensions/
2. [ ] Find Prompt Manager
3. [ ] Click "service worker" link
4. [ ] Console opens
5. [ ] Should see: "[Background] Service worker loaded"
6. [ ] Should see: "[Background] Context menus created"
7. [ ] No errors in console

### Content Script Console
1. [ ] Open any webpage
2. [ ] Open DevTools (F12)
3. [ ] In Console, should see: "[Content] Prompt Manager content script loaded"
4. [ ] No errors

### Popup Console
1. [ ] Right-click on popup → Inspect
2. [ ] DevTools opens
3. [ ] React should be rendering
4. [ ] No errors in console

## 7. Cross-Browser Compatibility 🌐

### Chrome/Chromium
- [x] Primary target - should work perfectly

### Edge
- [ ] Should work (Chromium-based)

### Brave
- [ ] Should work (Chromium-based)

### Firefox
- [ ] Not targeted in M0 (requires browser.* polyfill)

## 8. Performance Checks ⚡

- [ ] Service worker doesn't stay active unnecessarily
- [ ] Popup opens in < 500ms
- [ ] Content script loads without blocking page
- [ ] No memory leaks in background

## 9. Known Limitations (Expected) 🎯

These are intentional and documented:

- [ ] Icons are SVG placeholders (not PNG)
- [ ] Only one test prompt (hardcoded)
- [ ] Context menu shows "Lädt..." (no real prompts)
- [ ] No database connection yet
- [ ] OneDrive buttons are non-functional
- [ ] Import/Export buttons are non-functional

## 10. Git Status ✓

Before committing:

```bash
git status
```

Should show:
- All new files staged
- No build artifacts (dist/) staged
- No node_modules/ staged
- No package-lock.json changes (or staged if changed)

---

## ✅ M0 Sign-Off

**Date:** _____________  
**Checked By:** _____________  
**Status:** [ ] PASS / [ ] FAIL  

**Notes:**
_________________________________
_________________________________
_________________________________

---

## 🚀 Ready for M1?

If all checkboxes above are checked (except "Known Limitations" which are expected), then:

**M0 is COMPLETE ✅**

Proceed to M1: Database & CRUD Operations

---

## Quick Commands Reference

```bash
# Install
npm install

# Build
npm run build

# Dev mode (watch)
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format

# Test
npm run test
```
