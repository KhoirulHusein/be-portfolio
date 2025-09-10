import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/app/test/**/*.test.ts'],
    exclude: ['**/debug*.ts', '**/debug-test.ts', 'src/app/test/_scratch/**'],
    setupFiles: ['src/app/test/setup/test-env.ts'],
    hookTimeout: 30000,
    testTimeout: 30000,
    restoreMocks: true,
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: ['**/test/**', '**/*.d.ts'],
    },
  },
})
