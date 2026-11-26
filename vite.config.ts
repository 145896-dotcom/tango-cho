import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Everything is inlined into one HTML file so the app can be opened by
// double-clicking it, with no server and no network.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024,
    reportCompressedSize: false,
  },
})
