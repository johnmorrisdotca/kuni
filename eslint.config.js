import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "site/", "node_modules/", "test-results/", "playwright-report/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
  { files: ["scripts/**/*.ts", "scripts/**/*.mjs", "tsup.config.ts"], languageOptions: { globals: { console: "readonly", process: "readonly", fetch: "readonly", Buffer: "readonly", URL: "readonly", document: "readonly" } } },
  { files: ["e2e/**/*.mjs", "playwright.config.mjs"], languageOptions: { globals: { console: "readonly", URL: "readonly", document: "readonly", window: "readonly", location: "readonly", getComputedStyle: "readonly", localStorage: "readonly" } } },
  { files: ["scripts/readme-pictures.mjs", "scripts/readme-pictures-lib.mjs"], languageOptions: { globals: { window: "readonly", localStorage: "readonly" } } },
  { files: ["demo/**/*.js"], languageOptions: { globals: { document: "readonly", window: "readonly", location: "readonly", history: "readonly", navigator: "readonly", URLSearchParams: "readonly", setTimeout: "readonly", localStorage: "readonly", familyLanguage: "readonly", CustomEvent: "readonly", Node: "readonly", URL: "readonly", Blob: "readonly", setInterval: "readonly", clearInterval: "readonly", fetch: "readonly" } } },
);
