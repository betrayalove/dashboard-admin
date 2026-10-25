import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const target = env.API_TARGET || 'http://localhost:3081';
  return {
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { port: Number(env.FRONTEND_PORT || 5173), host: '127.0.0.1', proxy: {
      '/api': { target, changeOrigin: true },
      '/ws': { target, ws: true },
    } },
  };
});
