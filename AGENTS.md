# AGENTS.md

Work Sphere is a TanStack Start app (React 19, TypeScript, Vite 8, Tailwind CSS 4) with shadcn/ui components built on Base UI.

<coding_guidelines>

## Commands

Use `pnpm`. The dev server runs on port 3007.

- `pnpm dev`: start the dev server
- `pnpm build`: production build
- `pnpm typecheck`: `tsc --noEmit`
- `pnpm check`: Biome lint, format and assist checks (`pnpm check:write` to auto-fix)
- `pnpm lint` / `pnpm format`: Biome lint only / format with write
- `pnpm generate-routes`: regenerate `src/routeTree.gen.ts`
- `pnpm db:push`: push the Drizzle schema in `src/db/schema.ts` to the database
- `pnpm db:studio`: open Drizzle Studio

Before finishing a change, run `pnpm typecheck` and `pnpm check`. There is no test runner configured.

## Project layout

- `src/routes/`: file-based routes (TanStack Router). `__root.tsx` is the root layout.
- `src/router.tsx`: router setup.
- `src/routeTree.gen.ts`: generated. Never edit it by hand; it is excluded from Biome.
- `src/components/ui/`: shadcn/ui components (style `base-nova`, Base UI primitives, lucide icons).
- `src/hooks/`: shared hooks. `src/lib/utils.ts`: utilities, including `cn`.
- `src/styles.css`: Tailwind entry and theme CSS variables.

Use the `@/*` alias for imports from `src` (for example `@/components/ui/button`).

## Code style

Biome enforces formatting. Do not hand-format against it.

- 2-space indent, 80-column lines, LF endings.
- Double quotes, no semicolons, ES5 trailing commas, always parenthesize arrow params.
- Tailwind classes must be sorted. The `useSortedClasses` rule is an error and checks `cn(...)` and `cva(...)`. Build class strings through those helpers so sorting is applied.
- Import organizing is turned off, so keep imports tidy by hand.

## TypeScript

- `strict` is on, along with `noUnusedLocals` and `noUnusedParameters`. Remove unused code instead of prefixing it.
- `verbatimModuleSyntax` is on. Use `import type` (or inline `type`) for type-only imports.
- Avoid `any`. Prefer inferred types and narrow `unknown`.

## UI components

- Add components with `pnpm dlx shadcn@latest add <component>`. Do not hand-write components that shadcn provides.
- Components in `src/components/ui/` are generated. Prefer composing them in feature components over editing them. If you must edit one, keep the change small.
- Build on `@base-ui/react` primitives, not Radix. This project uses the Base UI flavor of shadcn (for example `render` prop, not `asChild`).
- Use `lucide-react` for icons.
- Style with Tailwind utilities and the theme CSS variables in `src/styles.css`. Avoid hard-coded colors; use semantic tokens such as `bg-background` and `text-muted-foreground`.
- Merge conditional classes with `cn` from `@/lib/utils`.

## Forms

- Build forms with TanStack Form (`useForm`, `form.Field`, `form.Subscribe`) and the shadcn field components (`FieldGroup`, `Field`, `FieldLabel`, `FieldError`). Do not hand-roll `div` + `Label` layouts.
- Validate with Zod through a standard schema: pass it to `validators` (for example `validators: { onSubmit: schema }`). Do not write ad hoc validation functions.
- Derive the schema from the Drizzle table with `createInsertSchema` from `drizzle-zod`, exported next to the table in `src/db/schema.ts`. Refine fields there (trim, min, max) and `.pick` only the fields the user submits. Use that one schema for both the form and the server function. Do not duplicate it.
- Keep form field types free of `null`. Use a plain `z.string()` refinement for nullable text columns, and convert `""` to `null` in the server function.
- Mark invalid fields with `data-invalid` on `Field` and `aria-invalid` on the control. Show `FieldError` only after the field is touched.
- Submit buttons live in `DialogFooter`/outside the `<form>` when needed. Link them with `type="submit"` and `form="<form-id>"`. Show pending state with `Spinner` and `disabled` from `form.Subscribe` on `isSubmitting`. `Button` has no loading prop.
- Reset the form with `form.reset(...)` when a dialog closes, so reopening starts clean.
- Mutations are server functions: `createServerFn({ method: "POST" }).validator(schema).handler(...)`. Use `.validator`, not the deprecated `.inputValidator`. Call them from components with `useServerFn`, then `router.invalidate()` to refresh route data.
- Read the user in the handler with `auth()` from `@clerk/tanstack-react-start/server` and throw if `!isAuthenticated`. Never accept `userId` from the client, and never include it in the input schema.
- Run `pnpm exec biome check --write <files>` on only the files you changed. Do not run `pnpm check:write` across the repo, since it reformats the generated `src/components/ui/` files.

## Database

Only use `pnpm db:push` to apply schema changes. Never generate or run migrations (`drizzle-kit generate` / `drizzle-kit migrate`).

This is a development project. There is no backwards compatibility and the data is worthless. Prefer data loss: never backfill, migrate or preserve existing rows, and never spend effort on keeping old data working. Every schema change means a clean state.

## Deployment

The app is deployed on Railway. When a change adds a new env var, set it on the Railway service with the `railway` CLI (for example `railway variable set KEY --stdin --skip-deploys`, value read from `.env.local`) before pushing. Never print secret values.

`TRIGGER_SECRET_KEY` is the exception: the deployment needs a different key than the one in `.env.local` (the production key, not the dev key). Never copy it from `.env.local`. It is already set on Railway; leave it alone.

## Routing

- Add a route by creating a file in `src/routes/`. The route tree regenerates when the dev server runs, or run `pnpm generate-routes`.
- Use `createFileRoute` and the router's typed `Link` and `useNavigate`. Do not use plain `<a>` for internal navigation.

## General

- Match existing patterns before introducing new ones.
- Keep changes minimal and focused. Do not add dependencies without need.
- Comment only when the reason is not obvious from the code.

</coding_guidelines>

## DiceBear

Use DiceBear 10. Documentation: https://www.dicebear.com/llms.txt

There are seven native cores with identical output, not one library with
wrappers. Use the one matching this project's language. Do not reach for the
JavaScript core when the project is written in something else:

    JavaScript  @dicebear/core + @dicebear/styles
    PHP         dicebear/core + dicebear/styles
    Python      dicebear-core + dicebear-styles
    Rust        dicebear-core + dicebear-styles
    Go          github.com/dicebear/dicebear-go/v10 + github.com/dicebear/styles/v10
    Dart        dicebear_core + dicebear_styles
    C#          DiceBear.Core + DiceBear.Styles

Every style page carries a loading snippet for all seven, for example
https://www.dicebear.com/styles/lorelei/index.md

HTTP API: https://api.dicebear.com/10.x/<style>/svg?seed=<seed> The seed is a
query parameter, not a path segment. Options are query parameters too; array
values are separated by commas.

Options named after a component end in Variant: eyesVariant, not eyes. This
holds in all seven cores and in the HTTP API. Look up the options of a style at
https://api.dicebear.com/10.x/<style>/options.json

Write these forms, not the ones on the left. The left column is pre-10 and the
API does not reject it, so an outdated call runs and silently does the wrong
thing:

    avatars.dicebear.com/api/<style>/<seed>.svg  ->  api.dicebear.com/10.x/<style>/svg?seed=<seed>
    api.dicebear.com/9.x/<style>/svg             ->  api.dicebear.com/10.x/<style>/svg
    npm install @dicebear/collection             ->  npm install @dicebear/styles
    npm install @dicebear/lorelei                ->  npm install @dicebear/styles
    createAvatar(lorelei, { seed })              ->  new Avatar(new Style(definition), { seed })
    { eyes: ['variant01'] }                      ->  { eyesVariant: ['variant01'] }
    ?radius=50                                   ->  ?borderRadius=50

Only JavaScript and the HTTP API have a pre-10 form. The other six cores were
released in 2026 and never had one, so any older-looking PHP, Python, Rust, Go,
Dart or C# API attributed to DiceBear is invented rather than outdated.

<!-- TRIGGER.DEV SKILLS START -->
## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.agents/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-authoring-chat-agent`, `trigger-authoring-tasks`, `trigger-chat-agent-advanced`, `trigger-cost-savings`, `trigger-getting-started`, `trigger-realtime-and-frontend`.
<!-- TRIGGER.DEV SKILLS END -->
