import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
    return {
      plugins: [react(), tailwindcss()],
      build: {
        // Normally emit the SPA into server/public/, which is committed to the
        // server-only deploy repo and served statically by Express in prod
        // (Render does not build the frontend). Rebuild + recommit after FE changes.
        // On Vercel (process.env.VERCEL is set by their build image) there is no
        // sibling server/ directory to write into, so emit to the standard
        // dist/ folder instead, matching frontend/vercel.json's outputDirectory.
        outDir: process.env.VERCEL
          ? 'dist'
          : path.resolve(__dirname, '../server/public'),
        emptyOutDir: true,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        // Allow ngrok (and other tunnel) hosts to reach the dev server.
        allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io'],
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
    };
});
