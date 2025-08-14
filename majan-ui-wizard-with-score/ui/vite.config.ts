import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set the base path so that the app works correctly on GitHub Pages
  // The repository name is "majan" so the UI will be served under /majan/
  base: '/majan/',
})