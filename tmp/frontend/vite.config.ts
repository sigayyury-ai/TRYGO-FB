import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@apollo/client', '@apollo/client/react', 'graphql'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  resolve: {
    dedupe: ['@apollo/client', 'graphql'],
    alias: {
      '@apollo/client/react': '@apollo/client/react/index.js',
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/graphql': {
        target: 'http://localhost:4100',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
