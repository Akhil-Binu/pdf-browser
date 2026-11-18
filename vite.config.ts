import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'PDF & Image Kit',
        short_name: 'PDFKit',
        description: '100% Client-Side Browser PDF & Image Utility Kit',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('pdfjs-dist') || id.includes('pdf-lib')) return 'vendor-pdf';
          if (id.includes('tesseract.js')) return 'vendor-ocr';
          if (id.includes('browser-image-compression') || id.includes('jszip')) return 'vendor-img';
          if (id.includes('@dnd-kit')) return 'vendor-dnd';
          if (id.includes('lucide-react')) return 'vendor-icons';
        },
      },
    },
  },
});
