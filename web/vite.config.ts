import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { serviceWorkerScript } from './lib/offline/serviceWorker'

// The api serves /env.js in production (api/cmd/api/spa.go); the dev server
// serves the same window.__ENV__ from the shell environment or .env files.
function devEnv(env: Record<string, string>): Plugin {
  return {
    name: 'dev-env',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/env.js', (_req, res) => {
        const values = {
          API_URL: env.API_URL ?? '',
          SENTRY_DSN_WEB: env.SENTRY_DSN_WEB ?? '',
          RELEASE: env.RELEASE ?? 'dev',
          KOBO_GATEWAY_RELEASE: env.KOBO_GATEWAY_RELEASE ?? 'dev',
          POSTHOG_KEY: env.POSTHOG_KEY ?? '',
          POSTHOG_HOST: env.POSTHOG_HOST ?? ''
        }
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        res.end(`window.__ENV__=${JSON.stringify(values)}`)
      })
    }
  }
}

// Emits sw.js with the build's hashed files as its precache list. The api
// swaps the __OFFLINE_ENABLED__ token at request time (OFFLINE_DISABLED kill
// switch), so one build serves every environment.
function serviceWorkerPlugin(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const precache = Object.keys(bundle).filter((name) => !name.endsWith('.map'))
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: serviceWorkerScript('__OFFLINE_ENABLED__', precache)
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sentryToken = process.env.SENTRY_AUTH_TOKEN
  return {
    plugins: [
      react(),
      tailwindcss(),
      devEnv(env),
      serviceWorkerPlugin(),
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: sentryToken,
        release: { name: process.env.RELEASE || 'dev' },
        sourcemaps: { filesToDeleteAfterUpload: ['dist/**/*.map'] },
        // Without a token the plugin skips the source-map upload.
        disable: !sentryToken,
        silent: !process.env.CI
      })
    ],
    resolve: { alias: { '@': path.resolve(import.meta.dirname) } },
    server: { port: 3000, strictPort: false },
    build: {
      outDir: 'dist',
      sourcemap: sentryToken ? 'hidden' : false,
      chunkSizeWarningLimit: 1500
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.tsx'],
      // Stale Stryker sandboxes hold outdated copies of the tests.
      exclude: ['node_modules', '.stryker-tmp', 'dist'],
      include: ['__tests__/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: [
          'components/**/*.{ts,tsx}',
          'lib/**/*.{ts,tsx}',
          'hooks/**/*.{ts,tsx}',
          'app/**/*.{ts,tsx}',
          'src/**/*.{ts,tsx}'
        ],
        exclude: ['lib/gen/**', '**/*.d.ts', 'src/main.tsx'],
        reporter: ['text', 'lcov'],
        // Ratchet: just below current coverage; raise as it improves.
        thresholds: { statements: 77, branches: 69, functions: 70, lines: 77 }
      }
    }
  }
})
