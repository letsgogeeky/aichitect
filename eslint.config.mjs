import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cloudflare/OpenNext build output — huge generated bundles that
    // crash ESLint with an OOM if scanned (same fix applied on Thoth and
    // Sopdet's own migrations).
    ".open-next/**",
    ".wrangler/**",
  ]),
]);

export default eslintConfig;
