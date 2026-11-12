import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    fileParallelism: false,
    testTimeout: 10000
  }
});
