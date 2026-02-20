import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ IMPORTANT: Change '/evotales/' to match your GitHub repository name exactly
// Example: if your repo is github.com/yourname/my-app → base: '/my-app/'
export default defineConfig({
  plugins: [react()],
  base: '/evotales/',
})
