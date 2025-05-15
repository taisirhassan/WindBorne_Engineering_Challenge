import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy for WindBorne balloon data
      '/treasure': {
        target: 'https://a.windbornesystems.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/treasure/, '/treasure')
      },
      // Proxy for OpenAQ air quality data
      '/openaq': {
        target: 'https://api.openaq.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openaq/, '') // Remove /openaq prefix
      },
      // Proxy for WAQI air quality data
      '/waqi': {
        target: 'https://api.waqi.info',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/waqi/, '') // Remove /waqi prefix
      }
    }
  }
})
