import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.js"],
    globals: true,
    testTimeout: 8000, // covers the one-time embedding-fallback timeout (3s) plus margin
  },
});
