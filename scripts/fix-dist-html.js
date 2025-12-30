const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dist = path.join(projectRoot, 'dist');

const mappings = [
  {
    src: path.join(projectRoot, 'src', 'ui', 'popup', 'popup.html'),
    dest: path.join(dist, 'popup.html'),
    js: 'popup.js',
    css: 'popup.css'
  },
  {
    src: path.join(projectRoot, 'src', 'ui', 'options', 'options.html'),
    dest: path.join(dist, 'options.html'),
    js: 'options.js',
    css: 'options.css'
  }
];

function ensureDir(p) {
  const d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

for (const m of mappings) {
  if (!fs.existsSync(m.src)) {
    console.warn('[fix-dist-html] Source HTML not found:', m.src);
    continue;
  }

  let html = fs.readFileSync(m.src, 'utf8');

  // Replace the module script to point to the flattened JS
  html = html.replace(/<script[^>]*src=["'].*?["'][^>]*><\/script>/, `<script type="module" src="./${m.js}"></script>`);

  // Replace any asset paths that include src/ui/... to root
  html = html.replace(/src\/ui\/[a-z0-9_\-\/]+\//gi, './');

  // Ensure CSS link exists (insert before </head> if css present in dist)
  const cssPath = path.join(dist, m.css);
  if (fs.existsSync(cssPath)) {
    if (!/href=["']\.\/.*?\.css["']/.test(html)) {
      html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="./${m.css}">\n</head>`);
    }
  }

  ensureDir(m.dest);
  fs.writeFileSync(m.dest, html, 'utf8');
  console.log('[fix-dist-html] Wrote', m.dest);

  // Remove nested HTML copy if it exists in dist (cleanup)
  const nested = path.join(dist, path.relative(projectRoot, m.src));
  if (fs.existsSync(nested)) {
    try {
      fs.unlinkSync(nested);
      // remove empty parent directories if now empty
      let dir = path.dirname(nested);
      while (dir !== dist && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        dir = path.dirname(dir);
      }
      console.log('[fix-dist-html] Removed nested file', nested);
    } catch (e) {
      // ignore
    }
  }
}

console.log('[fix-dist-html] Done.');
