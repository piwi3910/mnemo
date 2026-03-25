#!/usr/bin/env node
/**
 * Post-build script: adds .js extensions to relative imports in compiled output.
 * Required because tsc with moduleResolution: bundler doesn't add extensions,
 * but Node.js ESM requires them.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const distDir = new URL('../packages/server/dist', import.meta.url).pathname;

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix: from "./foo" → from "./foo.js"  (and ../ variants)
  // Only add .js if no extension already present
  const fixed = content.replace(
    /from\s+(["'])(\.{1,2}\/[^"']+)(["'])/g,
    (match, q1, path, q2) => {
      if (extname(path) !== '') return match; // already has extension
      changed = true;
      return `from ${q1}${path}.js${q2}`;
    }
  );

  if (changed) {
    writeFileSync(filePath, fixed);
  }
}

function walkDir(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkDir(full);
    } else if (entry.endsWith('.js')) {
      fixFile(full);
    }
  }
}

console.log('Fixing ESM imports in', distDir);
walkDir(distDir);
console.log('Done.');
