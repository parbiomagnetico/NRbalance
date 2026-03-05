// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: [
          'node:buffer',
          'node:crypto',
          'node:events',
          'node:fs',
          'node:http',
          'node:https',
          'node:net',
          'node:os',
          'node:path',
          'node:process',
          'node:stream',
          'node:url',
          'node:util',
          'node:zlib',
          'node:stream/web'
        ]
      }
    }
  }
});