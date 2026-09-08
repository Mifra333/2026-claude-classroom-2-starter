"use client";

import { CopilotChat, CopilotKit, useAgent } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { todoToolCallRenderers } from "@/components/tool-call-view";
import { TODO_WRITE_TOOLS } from "@/lib/todo-tool-contract";

/**
 * Keeps the server-rendered sidebar honest. A run may call a write tool several
 * times, so the refresh waits for the run to finalize — by then every `execute`
 * has committed — and only fires when one of them actually wrote. `refresh()`
 * re-runs app/page.tsx without remounting this subtree, so the chat transcript
 * and any in-flight stream are untouched.
 */
function RefreshSidebarOnWrite({ agentId }: { agentId: string }) {
  // No `updates`: this component renders nothing, so agent state changes must
  // not re-render it.
  const { agent } = useAgent({ agentId, updates: [] });
  const router = useRouter();

  useEffect(() => {
    let wrote = false;
    const { unsubscribe } = agent.subscribe({
      onNewToolCall: ({ toolCall }) => {
        wrote ||= TODO_WRITE_TOOLS.has(toolCall.function.name);
      },
      onRunFinalized: () => {
        if (!wrote) {
          return;
        }
        wrote = false;
        router.refresh();
      },
    });
    return unsubscribe;
  }, [agent, router]);

  return null;
}

/**
 * `threadId` is handed down from the server-rendered session rather than picked
 * here, so a reload rejoins the same Mastra thread instead of starting a new
 * one. See lib/tutor.ts for why a forged one is useless.
 */
export function Chat({
  agentId,
  threadId,
}: {
  agentId: string;
  threadId: string;
}) {
  return (
    // The Inspector is on by default in development builds and never loads in a
    // production one, so `enableInspector` is left unset deliberately;
    // `showDevConsole` is deprecated and no longer controls it either way.
    // app/globals.css moves its launcher off the header's sign-out button.
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      credentials="include"
      // Without these every tool call is invisible: CopilotKit renders nothing
      // for a tool it has no renderer for.
      renderToolCalls={todoToolCallRenderers}
    >
      <RefreshSidebarOnWrite agentId={agentId} />
      <CopilotChat
        agentId={agentId}
        threadId={threadId}
        className="h-full w-full"
        labels={{
          chatInputPlaceholder: "Add something to the list…",
        }}
      />
    </CopilotKit>
  );
}
