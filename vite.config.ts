import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/manifest.json',
          dest: '.'
        },
        {
          src: 'public/icons/*',
          dest: 'icons'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/sw.ts'),
        content: resolve(__dirname, 'src/content/content.ts'),
        popup: resolve(__dirname, 'src/ui/popup/popup.html'),
        options: resolve(__dirname, 'src/ui/options/options.html')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Map entry names to output filenames
          const nameMap: Record<string, string> = {
            background: 'background.js',
            content: 'content.js'
          };
          return nameMap[chunkInfo.name] || '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
