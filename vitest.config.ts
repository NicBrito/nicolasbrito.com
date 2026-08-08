import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Ambient NODE_ENV=production (e.g. from agent shells) loads React's production build, which lacks act() and falsely fails the whole suite.
    env: { NODE_ENV: 'test' },
    setupFiles: './src/tests/setup.ts',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
    },
  },
});