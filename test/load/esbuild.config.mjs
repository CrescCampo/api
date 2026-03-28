import { build } from 'esbuild';
import { glob } from 'glob';

const entryPoints = await glob('test/load/scenarios/*.ts');

await build({
  entryPoints,
  bundle: true,
  outdir: 'test/load/dist',
  platform: 'browser',
  format: 'esm',
  target: 'es2020',
  external: ['k6', 'k6/*', 'https://jslib.k6.io/*'],
});
