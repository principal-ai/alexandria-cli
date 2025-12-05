#!/usr/bin/env node
/* eslint-env node */
import * as esbuild from 'esbuild';
import { chmod } from 'fs/promises';

// Build the Alexandria CLI as a single bundled file
await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: {
    js: `#!/usr/bin/env node`,
  },
  external: [
    // Keep node built-ins external
    'node:*',
    // Keep all dependencies external
    '@a24z/core-library',
    '@a24z/markdown-utils',
    'chalk',
    'commander',
    'compression',
    'cors',
    'express',
    'globby',
    'ignore',
    'fast-glob',
    'glob',
  ],
  packages: 'external', // Keep all node_modules external
  minify: false, // Keep readable for debugging
  sourcemap: true,
});

// Make the CLI executable
await chmod('dist/index.js', 0o755);

console.log('✅ Alexandria CLI bundle built successfully');
