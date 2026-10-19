// `npm run test:mutation` runs the full baseline;
// scripts/test-mutation-diff.sh scopes `mutate` to changed files.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'npm',
  testRunner: 'vitest',
  vitest: { configFile: 'vite.config.ts' },
  reporters: ['clear-text', 'progress', 'html'],
  coverageAnalysis: 'perTest',
  // Mirrors the coverage `include` in vite.config.ts. package.json's overrides
  // exempt the instrumenter from the global @babel/core 7 pin: a Babel 7 parse
  // printed by its @babel/generator 8 crashes on TS function types and
  // `interface extends`.
  mutate: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    '!lib/gen/**',
    '!src/main.tsx',
    '!**/*.d.ts'
  ],
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json'
}
