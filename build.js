/**
 * build.js — bundles src/main.ts (and all imports) into app.bundle.js
 *
 * Usage:  node build.js
 *
 * The output file works both on GitHub Pages (HTTPS) and locally (file://)
 * because esbuild produces a self-contained IIFE with no import statements.
 */
'use strict';

const { buildSync } = require('esbuild');
const { statSync } = require('fs');

const result = buildSync({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'app.bundle.js',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  sourcemap: false,
  minify: false,
  logLevel: 'info',
});

const { size } = statSync('app.bundle.js');
const kb = (size / 1024).toFixed(1);
const lines = require('fs')
  .readFileSync('app.bundle.js', 'utf8')
  .split('\n').length;
console.log(`✅  app.bundle.js — ${lines} lines, ${kb} KB`);
