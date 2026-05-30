import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed to https://pvladimir1989.github.io/go-drill/
export default defineConfig({
  base: '/go-drill/',
  plugins: [react()],
})
