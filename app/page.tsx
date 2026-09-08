import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { SignOutButton } from "@/components/sign-out-button";
import { TodoSidebar } from "@/components/todo-sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listTodosFor } from "@/lib/todos";
import { TUTOR_AGENT_ID, tutorThreadId } from "@/lib/tutor";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const todos = await listTodosFor(db, session.user.id);

  return (
    <>
      <PageHeader title="Bartholomew" subtitle={session.user.name}>
        <SignOutButton />
      </PageHeader>
      <main className="flex flex-1 overflow-hidden bg-zinc-50 dark:bg-black">
        {/* `relative` anchors the chat, which globals.css positions absolutely
            against this pane rather than against <main>, so the sidebar keeps
            its width. */}
        <div className="chat-pane relative min-w-0 flex-1">
          <Chat
            agentId={TUTOR_AGENT_ID}
            threadId={tutorThreadId(session.user.id)}
          />
        </div>
        <TodoSidebar todos={todos} />
      </main>
    </>
  );
}
