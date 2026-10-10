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

## Routing

- Add a route by creating a file in `src/routes/`. The route tree regenerates when the dev server runs, or run `pnpm generate-routes`.
- Use `createFileRoute` and the router's typed `Link` and `useNavigate`. Do not use plain `<a>` for internal navigation.

## General

- Match existing patterns before introducing new ones.
- Keep changes minimal and focused. Do not add dependencies without need.
- Comment only when the reason is not obvious from the code.

</coding_guidelines>
