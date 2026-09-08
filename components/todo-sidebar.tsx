import type { Todo } from "@/lib/schema";

/**
 * Read-only by design: the agent is the write path, so there is no todos
 * endpoint and nothing here submits anything. `components/chat.tsx` re-renders
 * this server-rendered list when a run has touched the table.
 */
export function TodoSidebar({ todos }: { todos: Todo[] }) {
  const open = todos.filter((todo) => !todo.done).length;

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-baseline justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your list
        </span>
        <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
          {open} open
        </span>
      </div>

      {todos.length === 0 ? (
        <p className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
          Nothing on it yet. Ask Bartholomew to add something.
        </p>
      ) : (
        <ul className="flex-1 overflow-y-auto py-1">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-start gap-2 px-4 py-1.5 text-sm"
            >
              <span
                aria-hidden
                className={`mt-0.5 size-3.5 shrink-0 rounded-sm border ${
                  todo.done
                    ? "border-zinc-400 bg-zinc-400 dark:border-zinc-600 dark:bg-zinc-600"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
              />
              <span
                className={
                  todo.done
                    ? "text-zinc-400 line-through dark:text-zinc-600"
                    : "text-zinc-800 dark:text-zinc-200"
                }
              >
                {todo.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
