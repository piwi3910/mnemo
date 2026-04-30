#!/usr/bin/env node
import { execSync } from "node:child_process";

function exec(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { encoding: "utf8", stdio: "inherit", ...opts });
}

const dryRun = process.argv.includes("--dry-run");

console.log("Step 1/5: verify versions match");
exec("node scripts/verify-versions.js");

console.log("Step 2/5: build core packages");
exec("npm run build:core");

console.log("Step 3/5: typecheck and test");
exec("npm run typecheck --workspace=packages/core --workspace=packages/core-react");
exec("npm run test:core");

console.log("Step 4/5: publish");
const publishCmd = dryRun
  ? "npm publish --workspace=packages/core --workspace=packages/core-react --dry-run"
  : "npm publish --workspace=packages/core --workspace=packages/core-react";
exec(publishCmd);

console.log(dryRun ? "Dry run complete." : "Publish complete.");
