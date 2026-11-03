<div align="center">

<img src="src/logo.svg" alt="Work Sphere logo" width="96" />

# Work Sphere

**Chat with AI bots that work for you in their own sandboxes.**

Talk to a bot one-on-one or bring several into a group chat. Each bot gets an isolated cloud sandbox and a persistent memory across chats.

![TanStack Start](https://img.shields.io/badge/TanStack_Start-latest-orange)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)

</div>

## Features

- **1:1 and group chats** with AI bots, including editing and deleting groups.
- **Sandboxed bots.** Every bot runs in its own Daytona sandbox, and you can preview its screen live.
- **Cross-chat memory** through a `MEMORY.md` file in each bot sandbox.
- **Background work** with Trigger.dev tasks.
- **Authentication** with Clerk.
- **Paid plans and usage-based limits**, tracked in a usage ledger.

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start), React 19, Vite 8 |
| Language | TypeScript (strict) |
| UI | Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) on Base UI, lucide icons |
| Forms | TanStack Form, Zod, drizzle-zod |
| Database | Postgres on [Neon](https://neon.com), Drizzle ORM |
| Auth | [Clerk](https://clerk.com) |
| AI | [AI SDK](https://ai-sdk.dev) with DeepSeek |
| Sandboxes | [Daytona](https://www.daytona.io) |
| Background jobs | [Trigger.dev](https://trigger.dev) |
| Tooling | pnpm, Biome |
| Deployment | Railway |

## Getting started

### Prerequisites

- Node.js 20 or later
- [pnpm](https://pnpm.io)
- Accounts for Clerk, Neon, Daytona, Trigger.dev and DeepSeek

### Setup

```bash
git clone <repo-url>
cd work-sphere
pnpm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment variables](#environment-variables)), then push the schema and start the dev server:

```bash
pnpm db:push
pnpm dev
```

The app runs at http://localhost:3007.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk API keys |
| `VITE_CLERK_SIGN_IN_URL`, `VITE_CLERK_SIGN_UP_URL` | Sign-in and sign-up routes |
| `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Redirects after auth |
| `DATABASE_URL` | Pooled Neon connection string for the app |
| `DATABASE_URL_UNPOOLED` | Direct connection string for drizzle-kit |
| `NEON_BRANCH` | Neon branch name |
| `DEESEEK_API_KEY` | DeepSeek API key (the name matches `.env.example`) |
| `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF` | Trigger.dev credentials |
| `DAYTONA_API_KEY` | Daytona API key |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server on port 3007 |
| `pnpm build` | Production build |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |
| `pnpm check` | Biome lint, format and assist checks |
| `pnpm generate-routes` | Regenerate `src/routeTree.gen.ts` |
| `pnpm db:push` | Push the Drizzle schema to the database |
| `pnpm db:studio` | Open Drizzle Studio |

## Project structure

```text
src/
├── components/   # Feature components; ui/ holds generated shadcn components
├── db/           # Drizzle schema and client
├── hooks/        # Shared hooks
├── lib/          # Utilities
├── queries/      # Data queries
├── routes/       # File-based routes (TanStack Router)
└── trigger/      # Trigger.dev tasks
```

## Contributing

Read [`AGENTS.md`](AGENTS.md) for code style, UI, form and database conventions. Before opening a pull request, run:

```bash
pnpm typecheck
pnpm check
```
