import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), 'VITE_');
  const apiProxyTarget = environment.VITE_KARAA_API_PROXY_TARGET ?? 'http://127.0.0.1:4310';

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 4173,
      proxy: {
        '/v1': apiProxyTarget,
        '/health': apiProxyTarget,
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
    },
  };
});
