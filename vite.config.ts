import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { splitVendorChunkPlugin } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

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
