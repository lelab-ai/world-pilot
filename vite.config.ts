import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'https://worldpilot.lelab.ai',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 3500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three') || id.includes('postprocessing')) {
              return 'vendor-three';
            }
            if (id.includes('reactflow')) {
              return 'vendor-flow';
            }
            if (id.includes('react') || id.includes('zustand') || id.includes('scheduler')) {
              return 'vendor-react';
            }
          }
          if (id.includes('detailedSimulationModels')) {
            return 'procedural-models';
          }
        },
      },
    },
  },
})
