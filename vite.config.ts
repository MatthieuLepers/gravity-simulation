import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/gravity-simulation/' : '/',
  // server: {
  //   https: {
  //     key: readFileSync('./api/src/cert/key.pem'),
  //     cert: readFileSync('./api/src/cert/cert.pem'),
  //   },
  // },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~styles': fileURLToPath(new URL('./src/assets/styles', import.meta.url)),
      '~fonts': fileURLToPath(new URL('./src/assets/fonts', import.meta.url)),
    },
  },
});
