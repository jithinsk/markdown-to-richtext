import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'serializers/html/index': 'src/serializers/html/index.ts',
    'serializers/ansi/index': 'src/serializers/ansi/index.ts',
    'serializers/doc-tree/index': 'src/serializers/doc-tree/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
  outDir: 'dist',
})
