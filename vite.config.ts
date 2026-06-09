import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { mkdirSync, writeFileSync } from 'fs';

export default defineConfig({
  base: '/laveh/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
name: 'Laveh',
    short_name: 'Laveh',
    description: 'Персональный финмонитор',
        theme_color: '#090d12',
        background_color: '#090d12',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
    {
      name: 'laveh-state-dump',
      configureServer(server) {
        server.middlewares.use('/__laveh_state', (req, res) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            const dir = path.resolve(__dirname, 'data');
            mkdirSync(dir, { recursive: true });
            writeFileSync(path.join(dir, 'state.json'), body, 'utf-8');
            res.end('ok');
          });
        });
      },
    },
  ],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
