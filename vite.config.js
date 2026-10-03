import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      process.env.RENDER_EXTERNAL_HOSTNAME,
      'teachertoday-fjh6.onrender.com',
    ].filter(Boolean),
  },
})
