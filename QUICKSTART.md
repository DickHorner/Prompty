# Quick Start Guide

## 🚀 Get M0 Running in 3 Minutes

### Prerequisites
- Node.js 18+ installed
- Chrome browser

### Step 1: Install & Build (2 minutes)
```bash
# Clone the repo
git clone https://github.com/DickHorner/Prompty.git
cd Prompty

# Install dependencies
npm install

# Build the extension
npm run build
```

### Step 2: Load in Chrome (30 seconds)
1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle **"Developer mode"** ON (top-right)
4. Click **"Load unpacked"**
5. Navigate to and select the `Prompty/dist/` folder
6. Done! 🎉

### Step 3: Test It (30 seconds)

**Test Popup:**
- Click the extension icon in your toolbar
- You should see the Prompt Manager popup with search bar

**Test Context Menu:**
- Right-click anywhere on a webpage
- Look for "Prompt einfügen…" and other menu items

**Test Insertion:**
- Go to any site with a text field (e.g., chatgpt.com)
- Right-click in the text field
- Select "Prompt einfügen…" → choose the test prompt
- Text should be inserted (or copied to clipboard)

**Test Options:**
- Click the ⚙️ icon in the popup
- Options page should open in a new tab

---

## 🎯 What Works Now (M0)

✅ Extension loads and runs  
✅ Popup interface displays  
✅ Context menus appear  
✅ Text insertion works  
✅ Options page accessible  
✅ Settings button functional  

## 🔜 Coming Soon

- M1: Database & real prompt storage
- M2: Dynamic context menus
- M3: Hover preview
- M4: OneDrive sync

---

## 🐛 Troubleshooting

**Extension won't load?**
- Make sure you're selecting the `dist/` folder (not the root project folder)
- Check for errors in Chrome DevTools console

**Context menu not showing?**
- Reload the extension (click reload button in chrome://extensions/)
- Try on a different webpage

**Build fails?**
- Check Node version: `node --version` (need 18+)
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

---

## 📚 Full Documentation

- [BUILD.md](BUILD.md) - Complete build instructions
- [README.md](README.md) - Project overview
- [docs/plan.md](docs/plan.md) - Full feature specification
- [docs/M0-SUMMARY.md](docs/M0-SUMMARY.md) - What was built in M0

---

**Ready to develop? Run:** `npm run dev` for auto-rebuild on changes!
