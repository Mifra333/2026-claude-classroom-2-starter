// @vitest-environment node
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";

import { removeTempDir } from "./support/tmp-dir";

// lib/tutor.ts carries the `server-only` marker, which throws outside a Server
// Component. Importing the module for real builds a LibSQLStore and an Agent
// but makes no model call, so the module graph is exercised without OpenRouter.
vi.mock("server-only", () => ({}));

type TutorGlobal = typeof globalThis & {
  tutorStorage?: { close(): Promise<void> };
  mastra?: unknown;
};
const globalForTutor = globalThis as TutorGlobal;

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "ai-tutor-tutor-"));
  vi.stubEnv("DATABASE_URL", `file:${join(dir, "tutor.db")}`);
});

afterAll(async () => {
  await globalForTutor.tutorStorage?.close();
  globalForTutor.tutorStorage = undefined;
  globalForTutor.mastra = undefined;
  vi.unstubAllEnvs();
  await removeTempDir(dir);
});

test("a hot reload rebuilds the agent but reuses the connection", async () => {
  const first = await import("@/lib/tutor");
  const store = globalForTutor.tutorStorage;
  expect(store).toBeDefined();

  // What `next dev` does to this module on every save.
  vi.resetModules();
  const second = await import("@/lib/tutor");

  // Rebuilt, so an edit to `instructions` reaches the next request …
  expect(second.mastra).not.toBe(first.mastra);
  // … while the store — the object that owns the libSQL client — is the same,
  // so the reload did not open a second connection.
  expect(globalForTutor.tutorStorage).toBe(store);
});

test("production keeps caching the instance", async () => {
  vi.stubEnv("NODE_ENV", "production");

  vi.resetModules();
  const first = await import("@/lib/tutor");
  vi.resetModules();
  const second = await import("@/lib/tutor");

  expect(second.mastra).toBe(first.mastra);
});
