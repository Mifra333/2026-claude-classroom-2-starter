import { rm } from "node:fs/promises";

// On Windows libsql keeps the SQLite file handle open for ~8s after
// `client.close()` returns, so a temp dir holding one cannot be unlinked in
// teardown — waiting that out would cost more than the tests themselves. The
// directory comes from `mkdtemp` under the OS temp dir, so a failed cleanup is
// reclaimed by the OS and must never fail the suite.
export async function removeTempDir(dir: string): Promise<void> {
  try {
    await rm(dir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  } catch {
    // Left for the OS to reclaim.
  }
}
