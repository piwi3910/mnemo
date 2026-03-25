import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/server/vitest.config.ts",
      "packages/client/vitest.config.ts",
    ],
  },
});
