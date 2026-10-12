import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The sidebar footer shows the panel version (Flutter: `v1.0.0` in admin_sidebar.dart).
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    // Must run before the React plugin.
    tanstackRouter({
      target: 'react',
      routesDirectory: './src/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
      autoCodeSplitting: true,
      quoteStyle: 'single',
      semicolons: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    manifest: true,
    // The phone picker's flags load as files when shown; inlined, all 246 would fill its chunk.
    assetsInlineLimit: (file) => (file.includes('/flags/') ? false : undefined),
    rolldownOptions: {
      output: {
        // The phone metadata and the country list load with the client form, in a chunk of their
        // own: together they would take the form's chunk past the lazy-chunk budget.
        codeSplitting: {
          // Phone stays in its own lazy chunk (client form). Markdown stays with the business
          // route's dynamic import of react-markdown — a named group pulled it into the first load.
          groups: [{ name: 'phone', test: /node_modules[\\/]libphonenumber-js|countries\.gen/ }],
        },
      },
    },
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    restoreMocks: true,
    env: { VITE_API_BASE_URL: 'http://api.test' },
  },
});
