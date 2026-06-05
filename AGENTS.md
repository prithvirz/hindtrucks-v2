@C:\Users\apexp\.codex\RTK.md

--- project-doc ---

# Repository Guidelines

## Project Structure & Module Organization
This is a Vite + React + TypeScript driver app. Application code lives in `src/`, with the root shell in `src/App.tsx` and startup in `src/main.tsx`. Reusable UI is in `src/components/`, screens in `src/screens/`, state in `src/state/`, helpers in `src/lib/`, mock data in `src/data/`, and API adapters in `src/services/`. Feature code is grouped under `src/features/` such as `chatbot`, `offline`, `notifications`, and `tracking`. Localized strings live in `src/i18n/*.json`. Unit tests sit beside source files as `*.test.ts` or `*.test.tsx`; Playwright flows are in `e2e/`. Static PWA assets are in `public/`; notes and screenshots are under `docs/`.

## Build, Test, and Development Commands
Use npm scripts from the repo root:

- `npm run dev` starts the Vite development server.
- `npm run build` type-checks and creates the production bundle.
- `npm run preview` serves the production build locally.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run test` starts Vitest in watch mode.
- `npm run test:run` runs the unit test suite once.
- `npm run test:coverage` writes V8 coverage reports to `coverage/`.
- `npx playwright test` runs E2E tests against `http://localhost:5174`.

## Coding Style & Naming Conventions
Use TypeScript with `strict` mode enabled. Prefer function components and hooks. Components, contexts, and screens use `PascalCase` filenames such as `LoadCard.tsx`; hooks use `useCamelCase` names such as `useOnlineStatus.ts`; helpers and services use `camelCase` filenames. Name tests after the unit under test, for example `Button.test.tsx` or `format.test.ts`. Match local formatting in edited files; config files currently use 4-space indentation. Run `npm run typecheck` before finishing significant changes.

## Testing Guidelines
Vitest uses `jsdom`, Testing Library, and setup from `src/__tests__/setup.ts`. Add focused unit tests beside changed components, hooks, contexts, services, and helpers. Playwright tests are mobile-first, single-worker flows configured in `playwright.config.ts`; add E2E coverage for journeys that cross screens, offline behavior, localization, or routing. Keep generated reports such as `playwright-report/` and `coverage/` out of source changes unless explicitly needed.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit prefixes such as `feat:`, `fix:`, and `chore:` with concise imperative summaries. Keep commits scoped to one logical change. Pull requests should include a short behavior summary, test commands run, linked issues when applicable, and screenshots for visible UI changes, especially mobile screens.

## Agent-Specific Instructions
Repository instructions require shell commands to be prefixed with `rtk`. For PowerShell cmdlets, invoke them through PowerShell, for example `rtk powershell -NoProfile -Command "Get-Content package.json"`.
