import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env.VITE_VAPI_API_URL': JSON.stringify(env.VITE_VAPI_API_URL),
      'process.env.VITE_VAPI_WEB_TOKEN': JSON.stringify(env.VITE_VAPI_WEB_TOKEN),
      'process.env.VITE_VAPI_ASSISTANT_ID': JSON.stringify(env.VITE_VAPI_ASSISTANT_ID),
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('/lucide-react/')) return 'lucide-icons';
              if (id.includes('/@tanstack/')) return 'tanstack-query';
              if (id.includes('/ogl/')) return 'ogl-vendor';
              if (id.includes('/@vapi-ai/web/')) return 'vapi-sdk';
              return 'vendor';
            }
          }
        }
      }
    }
  }
})
