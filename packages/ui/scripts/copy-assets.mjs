#!/usr/bin/env node
/**
 * Copies non-TS assets from src/ into dist/ after tsc emits the JS/d.ts files.
 * `tsc -b` only handles TS sources; HTML / wasm / static assets need this step.
 */
import { mkdirSync, copyFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const srcRoot = resolve(pkgRoot, "src");
const distRoot = resolve(pkgRoot, "dist");

const ASSET_EXTS = new Set([".html", ".wasm", ".css", ".png", ".svg", ".ico", ".sql"]);

function copyAssetsRecursive(srcDir, destDir) {
  if (!existsSync(srcDir)) return 0;
  let copied = 0;
  for (const entry of readdirSync(srcDir)) {
    const srcPath = join(srcDir, entry);
    const destPath = join(destDir, entry);
    const st = statSync(srcPath);
    if (st.isDirectory()) {
      copied += copyAssetsRecursive(srcPath, destPath);
    } else {
      const dot = entry.lastIndexOf(".");
      const ext = dot >= 0 ? entry.slice(dot) : "";
      if (ASSET_EXTS.has(ext)) {
        mkdirSync(destDir, { recursive: true });
        copyFileSync(srcPath, destPath);
        copied++;
      }
    }
  }
  return copied;
}

const n = copyAssetsRecursive(srcRoot, distRoot);
console.log(`copy-assets: copied ${n} non-TS asset(s) into dist/`);
