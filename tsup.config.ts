import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'browser',
  sourcemap: true,
  target: 'es2020',
  dts: true,
  clean: true,
  treeshake: true,
})
