import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const hmrEnabled = process.env.DISABLE_HMR !== 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      // Let Vite infer websocket host/port from the current origin.
      // This avoids localhost ws failures when accessing via LAN/proxy hostnames.
      hmr: hmrEnabled ? undefined : false,
    },
  };
});
