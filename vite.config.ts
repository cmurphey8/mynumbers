import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// Library build: bundles the game + explainer for consumption by other apps.
// react / react-dom / @emotion are left as peer dependencies so the
// host app provides a single shared copy.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/client/**/*.test.{ts,tsx}'],
  },
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src/client'],
      outDir: 'dist/lib',
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: 'dist/lib',
    sourcemap: true,
    // Inline image assets (e.g. the Tim SVGs) as data URIs so the published
    // library is self-contained and consumers don't need to copy static files.
    assetsInlineLimit: (filePath) => filePath.endsWith('.svg') ? true : undefined,
    lib: {
      entry: resolve(__dirname, 'src/client/lib/index.tsx'),
      name: 'Arithmix',
      formats: ['es', 'umd'],
      fileName: (format) => `arithmix.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        '@emotion/react',
        '@emotion/react/jsx-runtime',
        '@emotion/styled',
      ],
      output: {
        // The library relies on client-only React features (hooks, Context,
        // Emotion's internal createContext). Mark the whole bundle as a client
        // module so it can be imported from React Server Components (e.g. the
        // Next.js App Router) without "createContext is not a function" errors.
        banner: '"use client";',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOMClient',
          'react/jsx-runtime': 'jsxRuntime',
          '@emotion/react': 'emotionReact',
          '@emotion/react/jsx-runtime': 'emotionJsxRuntime',
          '@emotion/styled': 'emotionStyled',
        },
      },
    },
  },
})
