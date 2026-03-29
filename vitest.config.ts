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
    name: 'unit',
    include: ['test/unit/**/*.spec.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    environment: 'node',
    clearMocks: true,
    setupFiles: ['./test/setup-env.ts'],
    maxWorkers: '50%',
    testTimeout: 10000,
    coverage: {
      reportsDirectory: 'coverage/unit',
      include: ['src/domain/application/use-cases/**/*.ts'],
      reporter: ['text', 'html'],
    },
  },
});
