import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['PPFB.png'],
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Guaw & Miaw POS',
        short_name: 'Guaw & Miaw',
        description: 'Punto de Venta y Gestión de Inventario',
        theme_color: '#FFB7C5', // brand color
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/PPFB.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/PPFB.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/PPFB.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5180,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
  }
});
