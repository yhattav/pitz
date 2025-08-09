import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Pitz',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['zustand', 'zod', 'crypto-js', 'lodash-es'],
      output: {
        globals: {
          'zustand': 'zustand',
          'zod': 'zod',
          'crypto-js': 'CryptoJS',
          'lodash-es': 'lodash'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});