import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
    setupFiles: ["./src/test-setup.ts"],
  },
});
