// @vitest-environment node
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RequestContext } from "@mastra/core/request-context";
import { noopObserve, type ValidationError } from "@mastra/core/tools";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql/node";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";

import type * as schema from "@/lib/schema";
import { todos, user } from "@/lib/schema";
import { createTodoTools, TODO_USER_ID_KEY } from "@/lib/todos";
import { removeTempDir } from "./support/tmp-dir";

// The executors the agent runs, against a throwaway file rather than
// data/app.db — lib/todos.ts takes the connection as an argument precisely so
// this is possible without the `server-only` marker from lib/db.ts.
let dir: string;
let db: ReturnType<typeof drizzle<typeof schema>>;
let tools: ReturnType<typeof createTodoTools>;

type Tools = ReturnType<typeof createTodoTools>;
type Executor<K extends keyof Tools> = NonNullable<Tools[K]["execute"]>;
type Input<K extends keyof Tools> = Parameters<Executor<K>>[0];
/** These three always return their output schema; the rest of the union cannot occur. */
type Output<K extends keyof Tools> = Exclude<
  Awaited<ReturnType<Executor<K>>>,
  // biome-ignore lint/suspicious/noConfusingVoidType: Mastra's own signature.
  void | ValidationError
>;

/**
 * Calls a tool the way the runtime does: the request context the CopilotKit
 * route builds from the verified session, plus the observability helper Mastra
 * always injects. Omit `userId` to call one the way nothing ever should.
 */
async function call<K extends keyof Tools>(
  name: K,
  input: Input<K>,
  userId?: string,
): Promise<Output<K>> {
  const requestContext = new RequestContext();
  if (userId !== undefined) {
    requestContext.set(TODO_USER_ID_KEY, userId);
  }

  // One cast for the whole file: `execute` is optional on the Tool type, and
  // TypeScript cannot see that `Input<K>` and `Output<K>` belong to the same K.
  const execute = tools[name].execute as (
    input: Input<K>,
    context: { requestContext: RequestContext; observe: typeof noopObserve },
  ) => Promise<Output<K>>;

  return execute(input, { requestContext, observe: noopObserve });
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "ai-tutor-todo-tools-"));
  db = drizzle({ connection: { url: `file:${join(dir, "test.db")}` } });
  await migrate(db, { migrationsFolder: "./drizzle" });
  tools = createTodoTools(db);

  await db.insert(user).values([
    { id: "user-1", name: "User One", email: "one@example.com" },
    { id: "user-2", name: "User Two", email: "two@example.com" },
  ]);
});

afterAll(async () => {
  db.$client.close();
  await removeTempDir(dir);
});

beforeEach(async () => {
  await db.delete(todos);
});

describe("addTodo", () => {
  test("puts the item on the calling user's list", async () => {
    const { todo } = await call("addTodo", { title: "  buy milk  " }, "user-1");

    expect(todo).toEqual({
      id: expect.any(String),
      title: "buy milk",
      done: false,
      createdAt: expect.any(String),
    });

    const rows = await db.select().from(todos);
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe("user-1");
  });
});

describe("listTodos", () => {
  test("reads back only the calling user's rows", async () => {
    await call("addTodo", { title: "mine" }, "user-1");
    await call("addTodo", { title: "theirs" }, "user-2");

    await expect(call("listTodos", {}, "user-1")).resolves.toEqual({
      todos: [expect.objectContaining({ title: "mine" })],
    });
    await expect(call("listTodos", {}, "user-2")).resolves.toEqual({
      todos: [expect.objectContaining({ title: "theirs" })],
    });
  });

  test("hides completed items when asked for the open ones", async () => {
    const { todo } = await call("addTodo", { title: "done already" }, "user-1");
    await call("addTodo", { title: "still open" }, "user-1");
    await call("setTodoDone", { id: todo.id, done: true }, "user-1");

    const { todos: open } = await call(
      "listTodos",
      { onlyOpen: true },
      "user-1",
    );
    expect(open.map((item) => item.title)).toEqual(["still open"]);
  });
});

describe("setTodoDone", () => {
  test("completes an item and puts it back", async () => {
    const { todo } = await call("addTodo", { title: "buy milk" }, "user-1");

    await expect(
      call("setTodoDone", { id: todo.id, done: true }, "user-1"),
    ).resolves.toEqual({
      updated: true,
      todo: expect.objectContaining({ id: todo.id, done: true }),
    });

    await expect(
      call("setTodoDone", { id: todo.id, done: false }, "user-1"),
    ).resolves.toEqual({
      updated: true,
      todo: expect.objectContaining({ id: todo.id, done: false }),
    });
  });

  test("cannot touch another user's item, even with its id", async () => {
    const { todo } = await call("addTodo", { title: "theirs" }, "user-2");

    // The id is real, the caller is not its owner: nothing matches the WHERE
    // clause, so the tool reports a miss rather than flipping the row.
    await expect(
      call("setTodoDone", { id: todo.id, done: true }, "user-1"),
    ).resolves.toEqual({ updated: false });

    const [row] = await db.select().from(todos).where(eq(todos.id, todo.id));
    expect(row.done).toBe(false);
  });
});

describe("without a user id on the request context", () => {
  test("listTodos refuses to run", async () => {
    await expect(call("listTodos", {})).rejects.toThrow(/request context/);
  });

  test("addTodo refuses to run and writes nothing", async () => {
    await expect(call("addTodo", { title: "buy milk" })).rejects.toThrow(
      /request context/,
    );
    await expect(db.select().from(todos)).resolves.toEqual([]);
  });

  test("setTodoDone refuses to run and changes nothing", async () => {
    const { todo } = await call("addTodo", { title: "buy milk" }, "user-1");

    await expect(
      call("setTodoDone", { id: todo.id, done: true }),
    ).rejects.toThrow(/request context/);

    const [row] = await db.select().from(todos).where(eq(todos.id, todo.id));
    expect(row.done).toBe(false);
  });
});
