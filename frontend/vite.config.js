import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or vue / svelte

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      'restro-bot.chotkari.com'
    ]
  }
})