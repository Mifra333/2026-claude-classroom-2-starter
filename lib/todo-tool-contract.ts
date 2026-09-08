import { z } from "zod";

/**
 * The wire contract between the to-do tools in lib/todos.ts and the renderers
 * in components/tool-call-view.tsx: one definition of every name and shape the
 * model sees, importable from a Client Component because nothing here reaches
 * for the database.
 */

/** Dates do not survive the trip to the model, so the tools speak ISO strings. */
export const todoShape = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
  createdAt: z.string(),
});

export type TodoView = z.infer<typeof todoShape>;

export const todoToolSchemas = {
  listTodos: {
    input: z.object({
      onlyOpen: z
        .boolean()
        .optional()
        .describe("Return only items that are not done yet."),
    }),
    output: z.object({ todos: z.array(todoShape) }),
  },
  addTodo: {
    input: z.object({
      title: z.string().min(1).describe("What is to be done."),
    }),
    output: z.object({ todo: todoShape }),
  },
  setTodoDone: {
    input: z.object({
      id: z.string().describe("The item's id, as returned by listTodos."),
      done: z.boolean().describe("True to complete it, false to reopen it."),
    }),
    output: z.object({ updated: z.boolean(), todo: todoShape.optional() }),
  },
} as const;

export type TodoToolName = keyof typeof todoToolSchemas;

/** The tools that change the table; `listTodos` only reads it. */
export const TODO_WRITE_TOOLS: ReadonlySet<string> = new Set<TodoToolName>([
  "addTodo",
  "setTodoDone",
]);
