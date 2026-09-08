"use client";

import { ToolCallStatus } from "@copilotkit/core";
// Type-only: `@copilotkit/react-core/v2` imports its own stylesheet, which a
// Vitest worker cannot load, and these renderers need nothing from it at
// runtime — `defineToolCallRenderer` only stamps this same type onto a literal.
import type { ReactToolCallRenderer } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";
import type { z } from "zod";
import { todoToolSchemas } from "@/lib/todo-tool-contract";

type Args<K extends keyof typeof todoToolSchemas> = z.infer<
  (typeof todoToolSchemas)[K]["input"]
>;

/**
 * Every tool call the tutor makes shows up in the transcript as one of these
 * rows: the tool's own name beside a plain-English account of what it did, so
 * the chat says not just what Bartholomew decided but how he carried it out.
 */
function ToolCallRow({
  name,
  pending,
  children,
}: {
  name: string;
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <div className="my-1 inline-flex max-w-full items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs">
      <span
        aria-hidden
        className={`size-1.5 shrink-0 rounded-full ${
          pending ? "animate-pulse bg-amber-500" : "bg-emerald-600"
        }`}
      />
      <code className="shrink-0 font-mono text-[11px] text-zinc-500">
        {name}
      </code>
      <span className="truncate text-zinc-700">{children}</span>
    </div>
  );
}

/** A tool result reaches the renderer as the JSON string the bridge sent. */
function parseResult<T>(
  schema: { safeParse(value: unknown): { success: boolean; data?: T } },
  result: string,
): T | undefined {
  try {
    const parsed = schema.safeParse(JSON.parse(result));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

/** Titles are the user's own words, so they are quoted rather than styled. */
function quote(title: string) {
  return `“${title}”`;
}

const listTodos: ReactToolCallRenderer<Args<"listTodos">> = {
  name: "listTodos",
  args: todoToolSchemas.listTodos.input,
  render: ({ name, args, status, result }) => {
    const what = args.onlyOpen ? "the open items" : "your list";

    if (status !== ToolCallStatus.Complete) {
      return (
        <ToolCallRow name={name} pending>
          Reading {what}…
        </ToolCallRow>
      );
    }

    const output = parseResult(todoToolSchemas.listTodos.output, result);
    const count = output?.todos.length;

    return (
      <ToolCallRow name={name} pending={false}>
        {count === undefined
          ? `Read ${what}`
          : count === 0
            ? `Read ${what} — nothing on it`
            : `Read ${what} — ${count} item${count === 1 ? "" : "s"}`}
      </ToolCallRow>
    );
  },
};

const addTodo: ReactToolCallRenderer<Args<"addTodo">> = {
  name: "addTodo",
  args: todoToolSchemas.addTodo.input,
  render: ({ name, args, status, result }) => {
    // While the arguments are still streaming in, `title` may be absent.
    const title = args.title;

    if (status !== ToolCallStatus.Complete) {
      return (
        <ToolCallRow name={name} pending>
          {title ? `Adding ${quote(title)}…` : "Adding an item…"}
        </ToolCallRow>
      );
    }

    const added = parseResult(todoToolSchemas.addTodo.output, result)?.todo;

    return (
      <ToolCallRow name={name} pending={false}>
        Added {quote(added?.title ?? title ?? "")} to your list
      </ToolCallRow>
    );
  },
};

const setTodoDone: ReactToolCallRenderer<Args<"setTodoDone">> = {
  name: "setTodoDone",
  args: todoToolSchemas.setTodoDone.input,
  render: ({ name, args, status, result }) => {
    if (status !== ToolCallStatus.Complete) {
      return (
        <ToolCallRow name={name} pending>
          {args.done === false ? "Reopening an item…" : "Completing an item…"}
        </ToolCallRow>
      );
    }

    const output = parseResult(todoToolSchemas.setTodoDone.output, result);
    // The id was not on this user's list, so nothing was changed.
    if (!output?.updated) {
      return (
        <ToolCallRow name={name} pending={false}>
          That item is not on your list
        </ToolCallRow>
      );
    }

    const title = output.todo ? quote(output.todo.title) : "that item";

    return (
      <ToolCallRow name={name} pending={false}>
        {args.done ? `Marked ${title} done` : `Put ${title} back on your list`}
      </ToolCallRow>
    );
  },
};

/** Handed to `<CopilotKit renderToolCalls>` in components/chat.tsx. */
export const todoToolCallRenderers = [listTodos, addTodo, setTodoDone];
