import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png'],
      manifest: {
        name: 'Double Cross Dice Roller',
        short_name: 'DX Roller',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          { urlPattern: ({request}) => request.destination === 'document', handler:'NetworkFirst', options:{cacheName:'html-cache'} },
          { urlPattern: ({request}) => request.destination === 'script' || request.destination === 'style', handler:'StaleWhileRevalidate', options:{cacheName:'asset-cache'} },
          { urlPattern: ({request}) => request.destination === 'image', handler:'CacheFirst', options:{cacheName:'image-cache', expiration:{maxEntries:100}} }
        ]
      }
    })
  ]
})
