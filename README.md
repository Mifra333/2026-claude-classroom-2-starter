# ai-tutor

AI tutoring web app on Next.js 16 App Router + React 19 + Tailwind v4: a Mastra
agent served to a CopilotKit chat over AG-UI, behind Better Auth email/password
sign-in, over a Drizzle/SQLite persistence layer.

See `AGENTS.md` for how the pieces fit together and why.

## Setup on a new machine

A clone gives you the source, but not the machine-local state — `node_modules`,
the SQLite file, `.env`, and the Playwright browser are all git-ignored. From a
fresh clone:

```bash
npm install                       # .npmrc pins legacy-peer-deps; without it this fails
npm rebuild esbuild               # native binaries are per-machine
cp .env.example .env              # then fill in the real values (see below)
npm run db:migrate                # creates data/app.db from drizzle/
npx next typegen                  # generates .next/types, or the typecheck fails
npx playwright install chromium   # only needed for npm run test:e2e
```

`.env` needs `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and
`OPENROUTER_API_KEY`; `OPENROUTER_BASE_URL` is optional and routes model traffic
through a local proxy. Never commit the file.

Then `npm run dev` and open http://localhost:3000.

## Verifying a checkout

```bash
npm run lint      # biome check
npm test          # vitest, single run
npm run build     # also type-checks via the project-local tsc
npm run test:e2e  # playwright, own dev server on port 3100
```

## Commands

See the Commands section of `AGENTS.md` for the full list, including the
`db:generate` / `db:migrate` and `auth:generate` flows.
