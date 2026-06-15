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

## Understanding the codebase

Use **graphify** to explore architecture and file relationships — `graphify-out/` holds the persistent knowledge graph for this repo. Treat questions about project structure as graphify queries first before manual searching.

## Conventions

- TypeScript `strict`. Function components + hooks only.
- Filenames: `PascalCase` components/contexts/screens; `useCamelCase` hooks; `camelCase` services/helpers. Tests `*.test.ts(x)` beside source.
- **Source files use 2-space indent; config files use 4-space.** Match the file you edit.
- Vitest setup: `src/__tests__/setup.ts` (jsdom + Testing Library + jest-dom). MSW available for service mocking.
- Conventional Commits (`feat:`/`fix:`/`chore:`), one logical change per commit.

## Active Task & Handoff

### Status: VERIFIED END-TO-END — Firebase Booking Loop

The full booking loop (customer post → driver accept → step updates → customer
tracking) was verified live against Firestore on 2026-06-14. Getting there
required fixing several gaps the earlier "COMPLETE" status missed — see
"Live-loop fixes" below.

### Live-loop fixes (2026-06-14):
- [`vite.config.ts`](vite.config.ts): driver `define` hardcoded `VITE_API_MODE`
  to `process.env` (undefined under dotenv → always `mock`); switched to
  `loadEnv` so `.env.local=firebase` is honoured. Added `optimizeDeps.include`
  for `firebase/app`+`firebase/firestore` and `resolve.dedupe` to fix a
  "Service firestore is not available" crash (split `@firebase/app` singleton
  from late `@fs` discovery of the shared package).
- Driver screens bypassed the service layer entirely. Wired
  [`Loads.tsx`](src/screens/Loads.tsx) and [`LoadDetail.tsx`](src/screens/LoadDetail.tsx)
  to `loadsService`, and [`TripContext.acceptLoad`](src/state/TripContext.tsx)
  to `loadsService.acceptLoad` (persists `status:accepted`+driver+`step:1`).
- Added trip rehydration in `TripContext` via `tripService.getActiveTrip()` so
  a reload restores the active trip instead of dropping to the empty state.
- Replaced two composite-index-requiring queries with single-field `where` +
  client-side sort/filter (customer `getMyBookings`, driver
  `getActiveLoadForDriver`) — Firestore had no composite indexes, so both
  silently returned empty.
- Installed missing `fake-indexeddb` dev dep (test harness couldn't load).
- All 136 driver tests pass; both apps typecheck clean.

### Status (prior): COMPLETE — Firebase Join Implementation

### Completed:
- Installed `firebase` SDK at repo root (hoisted via npm workspaces)
- Created shared Firebase init module at [`packages/shared/src/firebase/index.ts`](packages/shared/src/firebase/index.ts) (app init, db, docToLoad/loadToDocData converters, collection helpers)
- Added `DriverInfo` interface to [`packages/shared/src/types.ts`](packages/shared/src/types.ts)
- Added `"./firebase"` export to [`packages/shared/package.json`](packages/shared/package.json)
- Created customer Firestore services: `bookingService`, `trackingService`, `authService`, `profileService` in `customer/src/services/firebase/`
- Updated customer service switcher to 3-way: mock|real|firebase
- Created driver Firestore services: `loadsService`, `tripService` in `src/services/firebase/` with `toDriverLoad` adapter in `utils.ts`
- Updated driver service switcher to 3-way: mock|real|firebase (only loads+trip use Firestore; auth/earnings/profile/chat stay mock)
- Created `customer/.env` with VITE_API_MODE=firebase + Firebase config values
- Created `.env.firebase` template at repo root for driver firebase mode
- Created `firestore.rules` (open dev rules) and `firebase.json`, deployed to hindtruck project
- Both apps typecheck and build cleanly (no regression in mock mode)
- Documented live loop verification at [`docs/firebase-live-loop.md`](docs/firebase-live-loop.md)

### Done since (branches `feat/phone-otp-auth`, `feat/firestore-hardening`):
- **Firebase Auth**: real phone OTP (`signInWithPhoneNumber` + invisible reCAPTCHA)
  replaces anonymous sign-in in both apps. `VITE_FIREBASE_AUTH_TEST_MODE=true`
  bypasses reCAPTCHA for Console test numbers (local only — never prod).
- **Firestore rules**: `loads` reads now require `request.auth` (was public);
  create/update already owner-scoped + shape-validated. Deployed to `hindtruck`.
- **Real-time tracking**: `ITrackingService.subscribeTripStatus` — firebase uses
  `onSnapshot`, mock polls 4s. `TrackShipment` subscribes instead of polling.
- **Indexes**: `firestore.indexes.json` declares (shipperUid ASC, createdAt DESC);
  `getMyBookings` orders server-side. Deployed.

### Next Steps:
- De-duplicate the seeded `loads` docs — script ready at
  [`scripts/dedupe-loads.mjs`](scripts/dedupe-loads.mjs) (dry-run by default).
  Needs admin creds: `gcloud auth application-default login` (client deletes are
  forbidden by rules), then `node scripts/dedupe-loads.mjs [--apply]`.
- Move driver earnings/chat to Firestore if needed (still mock).
- Deploy apps to hosting (out of current scope).

### Next Agent Prompt:
> The Firebase booking loop is wired and verified end-to-end (see the handoff
> section in [`CLAUDE.md`](CLAUDE.md)). To run it locally: driver needs
> `VITE_API_MODE=firebase` (set in `.env.local`), customer already has it in
> `customer/.env`. Start both dev servers and follow
> [`docs/firebase-live-loop.md`](docs/firebase-live-loop.md). Remaining hardening
> is in "Next Steps".

