import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // In tests, unstable_cache is a transparent passthrough — no Next.js server context available.
      "next/cache": path.resolve(__dirname, "__mocks__/next-cache.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
