import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  appType: 'spa',
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/marketplace': {
        target: 'https://aqaariq.com',
        changeOrigin: true,
        secure: true,
      },
    }
  }
})


