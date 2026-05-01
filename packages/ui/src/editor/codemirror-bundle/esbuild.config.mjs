import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

const __dirname = dirname(new URL(import.meta.url).pathname);

async function build() {
  const result = await esbuild.build({
    entryPoints: [resolve(__dirname, "src/main.ts")],
    bundle: true,
    minify: true,
    format: "iife",
    target: ["es2020"],
    platform: "browser",
    write: false,
    define: { "process.env.NODE_ENV": '"production"' },
  });

  const js = result.outputFiles[0].text;
  const template = readFileSync(resolve(__dirname, "src/template.html"), "utf8");
  const html = template.replace("__BUNDLE_PLACEHOLDER__", js);

  const outDir = resolve(__dirname, "dist");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "editor.html"), html);

  const hash = createHash("sha256").update(html).digest("hex").slice(0, 16);
  writeFileSync(resolve(outDir, "BUILD_HASH"), hash + "\n");

  const sizeKb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
  console.log(`built editor.html: ${sizeKb}KB, hash=${hash}`);
}

build().catch(e => { console.error(e); process.exit(1); });
