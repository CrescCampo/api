import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'es2020',
      },
      module: { type: 'es6' },
    }),
  ],
  test: {
    globals: true,
    root: './',
    name: 'e2e',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    environment: 'node',
    clearMocks: true,
    setupFiles: ['./test/setup-env.ts', './test/e2e/setup/setup-e2e.ts'],
    testTimeout: 60000,
    maxWorkers: 1,
    reporters: ['default', 'html', 'junit'],
    outputFile: {
      html: 'test-reports/e2e/index.html',
      junit: 'test-reports/e2e/results.xml',
    },
    coverage: {
      reportsDirectory: 'coverage/e2e',
      include: ['src/infra/http/controllers/**/*.ts'],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});
