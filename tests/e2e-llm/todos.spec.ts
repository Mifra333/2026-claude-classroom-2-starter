import { expect, test } from "@playwright/test";

// Costs OpenRouter calls, so it is not in `npm run test:e2e`: playwright.config
// points at tests/e2e and cannot reach this directory. Run it deliberately with
// `npm run test:e2e:llm`, with a working OPENROUTER_API_KEY in .env.
//
// Like tests/e2e/auth.spec.ts this runs against the real dev server and
// data/app.db, so the account is stamped rather than fixed.
test("the agent puts an item on the list and the sidebar shows it", async ({
  page,
}) => {
  const email = `e2e-llm-${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL("/");

  const sidebar = page.getByRole("complementary");
  await expect(sidebar.getByText("Nothing on it yet.")).toBeVisible();

  // The composer's send button carries no accessible name, hence the slot
  // attribute. It stays disabled until CopilotKit has reached the runtime, so
  // typing and pressing Enter before then is silently dropped — wait for it.
  const send = page.locator('.copilotKitChat button[data-slot="button"]');
  await page
    .getByPlaceholder("Add something to the list…")
    .fill('Please put "buy milk" on my list.');
  await expect(send).toBeEnabled();
  await send.click();

  // The agent has to decide to call addTodo, the tool has to commit, and only
  // then does components/chat.tsx refresh the server-rendered sidebar — so this
  // asserts the whole path, not just the reply text.
  await expect(sidebar.getByText("buy milk")).toBeVisible();
  await expect(sidebar.getByText("1 open")).toBeVisible();

  // components/tool-call-view.tsx renders the call itself into the transcript,
  // so the user sees which tool ran and what it did.
  const transcript = page.locator(".copilotKitChat");
  // Exact: the model's own reasoning text names the tool as well.
  await expect(transcript.getByText("addTodo", { exact: true })).toBeVisible();
  await expect(
    transcript.getByText("Added “buy milk” to your list"),
  ).toBeVisible();

  // A reload re-reads the row from SQLite rather than from the transcript.
  await page.reload();
  await expect(
    page.getByRole("complementary").getByText("buy milk"),
  ).toBeVisible();
});
