import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * The suite that costs OpenRouter calls, kept out of `npm run test:e2e` by
 * living in its own directory rather than behind a flag — the default config's
 * `testDir` cannot reach it, so no invocation of it can run these by accident.
 * Needs a working OPENROUTER_API_KEY in .env; run it with `npm run test:e2e:llm`.
 */
export default defineConfig({
  ...base,
  testDir: "./tests/e2e-llm",
  // One model round trip per assertion, and glm-5.3-flash still has to decide
  // to call a tool; the default 30s expect timeout is not enough.
  timeout: 120_000,
  expect: { timeout: 60_000 },
});
