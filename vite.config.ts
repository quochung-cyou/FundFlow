import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { splitVendorChunkPlugin } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Split vendor chunks for better caching
    splitVendorChunkPlugin(),
    // Component tagging for development
    mode === 'development' ? componentTagger() : null,
    // Bundle analyzer in build mode with stats flag
    (mode === 'production' && process.env.STATS) ? visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    }) : null,
    // PWA Plugin
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Để Tui Trả',
        short_name: 'Để Tui Trả',
        description: 'Điểm chạm của nền kinh tế số',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        sourcemap: true,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    }),
  ].filter((plugin): plugin is NonNullable<typeof plugin> => plugin !== null),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build performance
    target: 'es2015',
    cssCodeSplit: true,
    reportCompressedSize: false, // Faster builds
    // Chunk optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {          
          // Let Vite handle other chunks automatically
          return null;
        },
      },
    },
    // Transpile dependencies that need it
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Make builds faster with reasonable chunk sizes
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dev performance
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
    exclude: [], // Add any problematic packages here
  },
}));
