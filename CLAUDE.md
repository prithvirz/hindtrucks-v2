# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`hindtrucks-driver` — Vite + React 18 + TypeScript driver PWA. Mobile-first prototype rendered inside a simulated phone frame (`PhoneFrame.tsx`). White + saffron theme, multi-language (en/hi/pa/ta/te/bn).

## Commands

- `npm run dev` — Vite dev server.
- `npm run build` — `tsc -b` then `vite build`.
- `npm run typecheck` — `tsc --noEmit`. Run before finishing significant changes.
- `npm run test` — Vitest watch. `npm run test:run` runs once. `npm run test:coverage` → `coverage/`.
- Single test: `npx vitest run src/path/File.test.tsx` or `-t "test name"`.
- `npx playwright test` — E2E against `http://localhost:5174` (note: dev server defaults to a different port; start preview/dev on 5174 first). Mobile viewport 390×844, single worker, chromium-only.
- Shell commands are auto-prefixed with `rtk` by the harness hook.

## Architecture

**Service layer (`src/services/`)** is the key abstraction. `services/index.ts` exports thin proxy objects (`authService`, `loadsService`, etc.) that dispatch at call time to either `mock/` or `real/` implementations based on `VITE_API_MODE` (`mock` default | `real`). Both sides implement the interfaces in `services/types.ts`. Real services use `apiClient.ts` (fetch wrapper: typed errors from `errors.ts`, bearer-token auth, timeout via AbortController, 401/403 → `onAuthFailure`). To add an endpoint: add to the interface in `types.ts`, implement in both `mock/` and `real/`, and add a proxy line in `index.ts`.

**State (`src/state/`)** is React Context, no external store. `AppProviders.tsx` nests them in dependency order: Theme → Auth → Shell → Profile → Trip → Earnings → Chat. Each context is consumed via its `useX` hook (throws if outside provider). Contexts call the service layer, not `apiClient` directly. Auth/profile/session persist to `localStorage` (`ht_auth`, `ht_phone`, `ht_auth_token`, `ht_registered_<phone>`, `ht_theme`). `ThemeContext` is currently a light-only stub (no dark mode active).

**Routing (`src/App.tsx`)** — all screens lazy-loaded. `RequireAuth` / `RequireRegistration` guards gate routes on `isLoggedIn` + registration status. `TAB_ROUTES` controls bottom-tab visibility; chatbot + onboarding tour render only on logged-in app screens.

**Features (`src/features/`)** — self-contained modules (`chatbot`, `notifications`, `offline`, `tracking`), each with its own `components/`, `hooks/`, `services/`, `types.ts`. These hold their own IndexedDB (`idb`) persistence and side-effecting logic (push subscriptions, geolocation, offline queue). Logout in `AuthContext` explicitly clears their IndexedDB stores.

**i18n (`src/i18n/`)** — `react-i18next`, one JSON per language. `languages.ts` is the language registry (`LangCode` declares 12 Indian languages: en/hi/pa/ta/te/bn/mr/gu/kn/ml/or/as) but only 6 have JSON translation files so far (en/hi/pa/ta/te/bn); the rest are listed in the picker pending translations. `index.ts` configures i18next. Add a key to every language JSON when adding strings.

**PWA** — `vite-plugin-pwa` (autoUpdate) with custom `public/sw-push-handler.js` imported into the service worker for push.

## Conventions

- TypeScript `strict`. Function components + hooks only.
- Filenames: `PascalCase` components/contexts/screens; `useCamelCase` hooks; `camelCase` services/helpers. Tests `*.test.ts(x)` beside source.
- **Source files use 2-space indent; config files use 4-space.** Match the file you edit.
- Vitest setup: `src/__tests__/setup.ts` (jsdom + Testing Library + jest-dom). MSW available for service mocking.
- Conventional Commits (`feat:`/`fix:`/`chore:`), one logical change per commit.
