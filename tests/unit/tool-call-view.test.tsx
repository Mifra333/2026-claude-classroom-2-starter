import { ToolCallStatus } from "@copilotkit/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { todoToolCallRenderers } from "@/components/tool-call-view";

// The renderers are plain components, so they are exercised directly rather
// than through CopilotKit — which would need a runtime and a model call.
function rendererFor(name: string) {
  const renderer = todoToolCallRenderers.find((r) => r.name === name);
  if (!renderer) {
    throw new Error(`no renderer registered for ${name}`);
  }
  return renderer.render;
}

/** A row the tools would really return; a partial one fails the output schema. */
function todoRow(title: string, done = false) {
  return { id: title, title, done, createdAt: "2026-09-08T09:00:00.000Z" };
}

/** What CopilotKit hands a renderer once the tool has returned. */
function complete(name: string, args: object, output: unknown) {
  const Renderer = rendererFor(name);
  return render(
    <Renderer
      name={name}
      toolCallId="call-1"
      // biome-ignore lint/suspicious/noExplicitAny: one shape per tool.
      args={args as any}
      status={ToolCallStatus.Complete}
      result={JSON.stringify(output)}
    />,
  );
}

describe("listTodos", () => {
  test("names the tool and counts what came back", () => {
    complete(
      "listTodos",
      {},
      {
        todos: [todoRow("buy milk"), todoRow("post the letter")],
      },
    );

    expect(screen.getByText("listTodos")).toBeInTheDocument();
    expect(screen.getByText("Read your list — 2 items")).toBeInTheDocument();
  });

  test("says so when the list is empty", () => {
    complete("listTodos", {}, { todos: [] });
    expect(
      screen.getByText("Read your list — nothing on it"),
    ).toBeInTheDocument();
  });

  test("reflects the onlyOpen argument", () => {
    complete("listTodos", { onlyOpen: true }, { todos: [todoRow("buy milk")] });
    expect(
      screen.getByText("Read the open items — 1 item"),
    ).toBeInTheDocument();
  });

  test("still renders when the result is not the expected shape", () => {
    complete("listTodos", {}, "nonsense");
    expect(screen.getByText("Read your list")).toBeInTheDocument();
  });
});

describe("addTodo", () => {
  test("quotes the title the tool actually stored", () => {
    complete(
      "addTodo",
      { title: "  buy milk  " },
      { todo: todoRow("buy milk") },
    );

    expect(
      screen.getByText("Added “buy milk” to your list"),
    ).toBeInTheDocument();
  });

  test("shows the streaming argument before the tool has returned", () => {
    const Renderer = rendererFor("addTodo");
    render(
      <Renderer
        name="addTodo"
        toolCallId="call-1"
        args={{ title: "buy milk" }}
        status={ToolCallStatus.InProgress}
        result={undefined}
      />,
    );

    expect(screen.getByText("Adding “buy milk”…")).toBeInTheDocument();
  });
});

describe("setTodoDone", () => {
  const todo = todoRow("buy milk", true);

  test("reports a completed item", () => {
    complete(
      "setTodoDone",
      { id: todo.id, done: true },
      { updated: true, todo },
    );
    expect(screen.getByText("Marked “buy milk” done")).toBeInTheDocument();
  });

  test("reports a reopened item", () => {
    complete(
      "setTodoDone",
      { id: todo.id, done: false },
      { updated: true, todo: { ...todo, done: false } },
    );
    expect(
      screen.getByText("Put “buy milk” back on your list"),
    ).toBeInTheDocument();
  });

  test("says nothing was changed when the id was not the user's", () => {
    complete("setTodoDone", { id: "other", done: true }, { updated: false });
    expect(
      screen.getByText("That item is not on your list"),
    ).toBeInTheDocument();
  });
});
