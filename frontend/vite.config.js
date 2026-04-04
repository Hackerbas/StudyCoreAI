import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    define: {
        'process.env.VERCEL_ANALYTICS_ID': JSON.stringify(process.env.VERCEL_ANALYTICS_ID),
        'process.env.VERCEL_URL': JSON.stringify(process.env.VERCEL_URL),
        'process.env.VERCEL_ENV': JSON.stringify(process.env.VERCEL_ENV)
    }
})
