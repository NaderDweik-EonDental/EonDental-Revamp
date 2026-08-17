import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

function alias(to: string): string {
  return fileURLToPath(new URL(to, import.meta.url));
}

export default defineConfig({
  resolve: {
    alias: {
      '@/app': alias('./src/1-app'),
      '@/pages': alias('./src/2-pages'),
      '@/widgets': alias('./src/3-widgets'),
      '@/features': alias('./src/4-features'),
      '@/entities': alias('./src/5-entities'),
      '@/shared': alias('./src/6-shared'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
