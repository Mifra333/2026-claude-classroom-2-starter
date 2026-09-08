// @vitest-environment node
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";

import { TODO_USER_ID_KEY } from "@/lib/todos";
import { removeTempDir } from "./support/tmp-dir";

// lib/tutor.ts carries the `server-only` marker, which throws outside a Server
// Component. Importing the module for real builds a LibSQLStore and an Agent
// but makes no model call, so the module graph is exercised without OpenRouter.
vi.mock("server-only", () => ({}));

type TutorGlobal = typeof globalThis & {
  tutorStorage?: { close(): Promise<void> };
  mastra?: unknown;
  // lib/tutor.ts now imports lib/db.ts for the to-do tools' connection, which
  // caches itself here the same way.
  db?: { $client: { close(): void } };
};
const globalForTutor = globalThis as TutorGlobal;

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "ai-tutor-tutor-"));
  vi.stubEnv("DATABASE_URL", `file:${join(dir, "tutor.db")}`);
});

afterAll(async () => {
  await globalForTutor.tutorStorage?.close();
  globalForTutor.db?.$client.close();
  globalForTutor.tutorStorage = undefined;
  globalForTutor.mastra = undefined;
  globalForTutor.db = undefined;
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

test("the request context carries the user id the to-do tools read", async () => {
  const { tutorRequestContext } = await import("@/lib/tutor");

  // The key lib/todos.ts looks for, and nothing else — a tool that cannot name
  // its owner refuses to run.
  expect(tutorRequestContext("user-1").get(TODO_USER_ID_KEY)).toBe("user-1");
});

test("production keeps caching the instance", async () => {
  vi.stubEnv("NODE_ENV", "production");

  vi.resetModules();
  const first = await import("@/lib/tutor");
  vi.resetModules();
  const second = await import("@/lib/tutor");

  expect(second.mastra).toBe(first.mastra);
});
