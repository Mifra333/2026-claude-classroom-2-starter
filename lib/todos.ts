import type { RequestContext } from "@mastra/core/request-context";
import { createTool } from "@mastra/core/tools";
import { and, asc, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "@/lib/schema";
import { todos } from "@/lib/schema";
import { type TodoView, todoToolSchemas } from "@/lib/todo-tool-contract";

/**
 * The tools take the connection as an argument rather than importing it, so
 * lib/db.ts's `server-only` marker stays out of this module graph and a test
 * can run the very same executors against a throwaway file.
 */
export type TodoDatabase = LibSQLDatabase<typeof schema>;

/**
 * Request-context key carrying the owner of every row these tools touch. The
 * route sets it from the verified session (see app/api/copilotkit); it is not
 * part of any tool's input schema, so neither the model nor the client can
 * name a different user.
 */
export const TODO_USER_ID_KEY = "userId";

function toView(row: typeof todos.$inferSelect): TodoView {
  return {
    id: row.id,
    title: row.title,
    done: row.done,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Every read the app does, and the one the `listTodos` tool wraps. Oldest
 * first, so "the first thing on your list" means the same to the sidebar and
 * to the agent.
 */
export async function listTodosFor(db: TodoDatabase, userId: string) {
  return db
    .select()
    .from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(asc(todos.createdAt), asc(todos.id));
}

/**
 * The user id is a precondition, not an input: a tool that cannot name its
 * owner must not touch a single row, so this throws rather than defaulting.
 */
function requireUserId(context?: { requestContext?: RequestContext }): string {
  const userId = context?.requestContext?.get(TODO_USER_ID_KEY);
  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error(
      `todo tools: no ${TODO_USER_ID_KEY} on the request context — the caller must set it from the session`,
    );
  }
  return userId;
}

/**
 * The tutor's write path onto lib/schema.ts's `todos`. Every statement carries
 * `userId` in its WHERE clause, so a row id belonging to somebody else simply
 * matches nothing.
 */
export function createTodoTools(db: TodoDatabase) {
  const listTodos = createTool({
    id: "listTodos",
    description:
      "Read back the signed-in user's to-do list. Call this before answering any question about what is on the list.",
    inputSchema: todoToolSchemas.listTodos.input,
    outputSchema: todoToolSchemas.listTodos.output,
    execute: async ({ onlyOpen }, context) => {
      const userId = requireUserId(context);
      const rows = await listTodosFor(db, userId);
      const visible = onlyOpen ? rows.filter((row) => !row.done) : rows;
      return { todos: visible.map(toView) };
    },
  });

  const addTodo = createTool({
    id: "addTodo",
    description:
      "Put a new item on the signed-in user's to-do list. Use the user's own wording, trimmed to a short line.",
    inputSchema: todoToolSchemas.addTodo.input,
    outputSchema: todoToolSchemas.addTodo.output,
    execute: async ({ title }, context) => {
      const userId = requireUserId(context);
      const [row] = await db
        .insert(todos)
        .values({ userId, title: title.trim() })
        .returning();
      return { todo: toView(row) };
    },
  });

  const setTodoDone = createTool({
    id: "setTodoDone",
    description:
      "Mark one item on the signed-in user's list done, or put it back on the list. Take the id from listTodos.",
    inputSchema: todoToolSchemas.setTodoDone.input,
    outputSchema: todoToolSchemas.setTodoDone.output,
    execute: async ({ id, done }, context) => {
      const userId = requireUserId(context);
      // The userId in the WHERE clause is the isolation: another user's id
      // updates nothing and reports back that it was not found.
      const [row] = await db
        .update(todos)
        .set({ done })
        .where(and(eq(todos.id, id), eq(todos.userId, userId)))
        .returning();
      return row ? { updated: true, todo: toView(row) } : { updated: false };
    },
  });

  return { listTodos, addTodo, setTodoDone };
}
