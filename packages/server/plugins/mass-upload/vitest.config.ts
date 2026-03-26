import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),
  test: {
    globals: true,
    environment: "node",
    root: path.resolve(__dirname),
    include: ["server/__tests__/**/*.test.ts"],
  },
});
