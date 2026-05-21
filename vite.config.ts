import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.json',
        includeAssets: ['favicon.svg', 'icon-192.png', 'icon-192-maskable.png', 'icon-512.png', 'icon-96.png', 'screenshot.jpg'],
        manifest: {
          name: 'SmartCart',
          short_name: 'SmartCart',
          description: 'Shopping budget tracker with real-time analytics and multi-language support.',
          theme_color: '#E57373',
          background_color: '#F9F7F2',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          id: '/?source=pwa',
          lang: 'en',
          prefer_related_applications: false,
          iarc_rating_id: '8ef9e1a1-9650-4966-9a2c-9743cfca9333',
          categories: ["utilities", "shopping", "finance"],
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          screenshots: [
            {
              src: '/screenshot.jpg',
              sizes: '768x1376',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'SmartCart Dashboard'
            }
          ],
          shortcuts: [
            {
              name: 'Add Expense',
              short_name: 'Add',
              description: 'Quickly log a new grocery item',
              url: '/?add=true',
              icons: [
                { src: '/icon-96.png', sizes: '96x96', type: 'image/png' },
                { src: '/icon-192.png', sizes: '192x192', type: 'image/png' }
              ]
            },
            {
              name: 'View Budget',
              short_name: 'Budget',
              description: 'Check your remaining shopping funds',
              url: '/?view=budget',
              icons: [
                { src: '/icon-96.png', sizes: '96x96', type: 'image/png' },
                { src: '/icon-192.png', sizes: '192x192', type: 'image/png' }
              ]
            }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
