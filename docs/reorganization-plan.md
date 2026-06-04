# HindTrucks Project Reorganization Plan

> **Status:** Draft — Ready for Review  
> **Date:** 2026-06-04  
> **Principle:** Move/delete only non-essential clutter; preserve all source imports; zero build breakage.

---

## 1. Problem Inventory

### 1.1 Root-Level Clutter (23 files)

| File(s) | Issue | Action |
|---------|-------|--------|
| `01-splash.png` through `13-home-final.png` (13 files) | Screenshot captures from development | Move to `docs/screenshots/` |
| `premium-desktop.png`, `premium-detail.png`, `premium-earnings.png`, `premium-home.png`, `premium-home2.png`, `premium-home3.png`, `premium-language.png`, `premium-trip.png` (8 files) | Premium feature screenshots | Move to `docs/screenshots/` |
| `1324832_screenshot.png`, `1324832_shot.png`, `1324832.png` (3 files) | Unnamed screenshot dumps | Move to `docs/screenshots/` |
| `test-output.txt`, `test-output2.txt`, `test-output3.txt` | Temp test output logs (already in `.gitignore`) | **Delete** |
| `cloudflared_err.txt`, `cloudflared_out.txt` | Active tunnel logs (in `.gitignore`, used by running Terminal 3) | **Keep** — actively in use |
| `.roomodes` | Roo Code configuration file | **Keep** — required by Roo Code at project root |

**Total root files cleaned:** 24 deleted/moved, reducing root file count from ~35 to ~11.

### 1.2 `src/` Structural Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Duplicate i18n mock files | [`src/__tests__/__mocks__/i18next.ts`](src/__tests__/__mocks__/i18next.ts) + [`src/__tests__/mocks/i18n.ts`](src/__tests__/mocks/i18n.ts) | **High** — both are dead code; `setup.ts` already handles i18n mocking |
| Orphan utility file | [`src/assets.ts`](src/assets.ts) — single file at src root, not in a directory | **Medium** — should live in `src/lib/` |
| Thin data directory | [`src/data/`](src/data/) — only 2 files (`mockLoads.ts`, `staticFaqs.ts`) | **Low** — acceptable but worth noting |

### 1.3 Dead Code: Duplicate i18n Mocks

**File A:** [`src/__tests__/__mocks__/i18next.ts`](src/__tests__/__mocks__/i18next.ts) (64 lines)
- Creates a full mock `i18n` object with all i18next API surface
- **Not imported by any test file** — zero references across the codebase
- Intended as Vitest `__mocks__` auto-resolution, but Vitest config doesn't point to it

**File B:** [`src/__tests__/mocks/i18n.ts`](src/__tests__/mocks/i18n.ts) (12 lines)
- Uses `vi.mock('react-i18next', ...)` to mock `useTranslation` and `Trans`
- **Not imported by any test file** — zero references across the codebase
- Functionally duplicates what [`src/__tests__/setup.ts`](src/__tests__/setup.ts) (lines 21-35) already does

**Verdict:** Both files are dead code. `setup.ts` handles all i18n mocking via `vi.mock` at the global setup level. **Safe to delete.**

---

## 2. Import Dependency Map

All files importing from the paths that will change:

### `src/assets.ts` → `src/lib/assets.ts`

| File | Current Import | New Import |
|------|---------------|------------|
| [`src/data/mockLoads.ts`](src/data/mockLoads.ts:1) | `from '../assets'` | `from '../lib/assets'` |
| [`src/screens/Home.tsx`](src/screens/Home.tsx:11) | `from '../assets'` | `from '../lib/assets'` |
| [`src/screens/Login.tsx`](src/screens/Login.tsx:6) | `from '../assets'` | `from '../lib/assets'` |
| [`src/screens/Splash.tsx`](src/screens/Splash.tsx:5) | `from '../assets'` | `from '../lib/assets'` |

**Total import updates:** 4 files, 4 lines.

### Dead mock files (safe to delete)

| File | Imported By |
|------|------------|
| [`src/__tests__/__mocks__/i18next.ts`](src/__tests__/__mocks__/i18next.ts) | **Nothing** |
| [`src/__tests__/mocks/i18n.ts`](src/__tests__/mocks/i18n.ts) | **Nothing** |

---

## 3. Migration Plan

### Phase 1: Root Cleanup

#### Step 1.1 — Create screenshots directory

```bash
mkdir -p docs/screenshots
```

#### Step 1.2 — Move all PNG screenshots out of root

```bash
# Dev screenshots (13 files)
move 01-splash.png docs/screenshots/
move 02-language.png docs/screenshots/
move 03-login-hi.png docs/screenshots/
move 04-home-hi.png docs/screenshots/
move 05-loads-hi.png docs/screenshots/
move 06-detail-hi.png docs/screenshots/
move 07-trip-hi.png docs/screenshots/
move 08-trip-complete.png docs/screenshots/
move 09-earnings-hi.png docs/screenshots/
move 09b-earnings-fixed.png docs/screenshots/
move 10-profile-hi.png docs/screenshots/
move 11-profile-tamil.png docs/screenshots/
move 12-desktop-frame.png docs/screenshots/
move 13-home-final.png docs/screenshots/

# Premium screenshots (8 files)
move premium-desktop.png docs/screenshots/
move premium-detail.png docs/screenshots/
move premium-earnings.png docs/screenshots/
move premium-home.png docs/screenshots/
move premium-home2.png docs/screenshots/
move premium-home3.png docs/screenshots/
move premium-language.png docs/screenshots/
move premium-trip.png docs/screenshots/

# Unnamed screenshots (3 files)
move 1324832_screenshot.png docs/screenshots/
move 1324832_shot.png docs/screenshots/
move 1324832.png docs/screenshots/
```

#### Step 1.3 — Delete temp test output files

```bash
del test-output.txt
del test-output2.txt
del test-output3.txt
```

Also update [`.gitignore`](.gitignore) to remove the now-unnecessary entries for these deleted files (lines 6-12).

#### Step 1.4 — Keep cloudflared logs

[`cloudflared_err.txt`](cloudflared_err.txt) and [`cloudflared_out.txt`](cloudflared_out.txt) are actively written to by Terminal 3's tunnel process. They are already in `.gitignore`. **Do not delete.**

### Phase 2: src/ Cleanup

#### Step 2.1 — Move `assets.ts` into `src/lib/`

```bash
move src/assets.ts src/lib/assets.ts
```

#### Step 2.2 — Update import paths (4 files)

**File:** [`src/data/mockLoads.ts`](src/data/mockLoads.ts:1)
```diff
- import { goodsImage } from '../assets'
+ import { goodsImage } from '../lib/assets'
```

**File:** [`src/screens/Home.tsx`](src/screens/Home.tsx:11)
```diff
- import { images } from '../assets'
+ import { images } from '../lib/assets'
```

**File:** [`src/screens/Login.tsx`](src/screens/Login.tsx:6)
```diff
- import { images } from '../assets'
+ import { images } from '../lib/assets'
```

**File:** [`src/screens/Splash.tsx`](src/screens/Splash.tsx:5)
```diff
- import { images } from '../assets'
+ import { images } from '../lib/assets'
```

#### Step 2.3 — Delete dead i18n mock files

```bash
del src\__tests__\__mocks__\i18next.ts
del src\__tests__\mocks\i18n.ts
```

After deletion, the empty directories can be removed:
```bash
rmdir src\__tests__\__mocks__
rmdir src\__tests__\mocks
```

> **Note:** [`vitest.config.ts`](vitest.config.ts:20) already excludes `src/__tests__/**` from coverage — no config change needed.

### Phase 3: Validation

After all changes, run the full verification suite:

```bash
npm run typecheck        # TypeScript compilation check
npm run test:run         # Full test suite
npm run build            # Production build
```

---

## 4. Target Structure (After Reorganization)

```
hindtrucks/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .wrangler/
├── docs/
│   ├── architecture/
│   │   ├── api-service-layer.md
│   │   ├── feature-enhancements.md
│   │   ├── state-decentralization.md
│   │   └── tests-ci-performance.md
│   ├── reorganization-plan.md          ← THIS FILE
│   └── screenshots/                    ← NEW: all PNGs moved here
│       ├── 01-splash.png
│       ├── 02-language.png
│       ├── ... (21 more PNGs)
│       └── premium-trip.png
├── public/
│   ├── favicon.svg
│   ├── pwa-192.png
│   ├── pwa-512.png
│   └── sw-push-handler.js
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── vite-env.d.ts
│   ├── __tests__/
│   │   ├── setup.ts
│   │   ├── smoke.test.ts
│   │   └── test-utils.tsx
│   ├── components/
│   │   ├── AIChatbot.tsx / .test.tsx
│   │   ├── AppLogo.tsx
│   │   ├── BottomTabBar.tsx / .test.tsx
│   │   ├── Button.tsx / .test.tsx
│   │   ├── Card.tsx / .test.tsx
│   │   ├── ErrorBoundary.tsx / .test.tsx
│   │   ├── LanguageChip.tsx / .test.tsx
│   │   ├── LoadCard.tsx / .test.tsx
│   │   ├── OnboardingTour.tsx / .test.tsx
│   │   ├── PhoneFrame.tsx / .test.tsx
│   │   ├── RouteMap.tsx / .test.tsx
│   │   ├── StatusStepper.tsx / .test.tsx
│   │   ├── Toggle.tsx / .test.tsx
│   │   └── TopBar.tsx / .test.tsx
│   ├── data/
│   │   ├── mockLoads.ts
│   │   └── staticFaqs.ts
│   ├── features/                       ← KEPT AS-IS
│   │   ├── chatbot/
│   │   ├── notifications/
│   │   ├── offline/
│   │   └── tracking/
│   ├── i18n/
│   │   ├── en.json, hi.json, pa.json, ta.json, te.json
│   │   ├── index.ts
│   │   └── languages.ts
│   ├── lib/
│   │   ├── assets.ts                   ← MOVED from src/assets.ts
│   │   ├── format.ts / .test.ts
│   │   └── matching.ts
│   ├── screens/
│   │   ├── ActiveTrip.tsx
│   │   ├── Earnings.tsx / .test.tsx
│   │   ├── Home.tsx / .test.tsx
│   │   ├── LanguagePicker.tsx
│   │   ├── LoadDetail.tsx
│   │   ├── Loads.tsx
│   │   ├── Login.tsx / .test.tsx
│   │   ├── Otp.tsx
│   │   ├── Profile.tsx
│   │   ├── Register.tsx / .test.tsx
│   │   └── Splash.tsx
│   ├── services/                       ← KEPT AS-IS
│   │   ├── apiClient.ts
│   │   ├── errors.ts / .test.ts
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── mock/
│   │   └── real/
│   └── state/                          ← KEPT AS-IS
│       ├── AppContext.tsx
│       ├── AppProviders.tsx
│       ├── AuthContext.tsx / .test.tsx
│       ├── ChatContext.tsx
│       ├── EarningsContext.tsx / .test.tsx
│       ├── ProfileContext.tsx / .test.tsx
│       ├── ShellContext.tsx / .test.tsx
│       ├── TripContext.tsx / .test.tsx
│       └── types.ts
├── .env.example
├── .gitignore
├── .node-version
├── .roomodes
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 5. `.gitignore` Cleanup

After deleting `test-output*.txt`, remove the now-redundant entries from [`.gitignore`](.gitignore):

```diff
  node_modules/
  dist/
  cloudflared_out.txt
  cloudflared_err.txt
  graphify-out/
- test-output.txt
- test-output2.txt
- test-output3.txt
- test-output4.txt
- test-output5.txt
- test-output6.txt
  tunnel_output.txt
  tsconfig.tsbuildinfo
  *.local
  .env
  .DS_Store
  Thumbs.db
  .playwright-mcp/
  .claude/
  .agents/
```

---

## 6. Optional: Future Considerations

These are not part of the immediate plan but worth evaluating later:

| Consideration | Rationale |
|--------------|-----------|
| Move `src/data/` → `src/lib/data/` | Consolidates all utility/constant code under `lib/`. Currently only 2 files — low priority. |
| Add `@/` path alias in `tsconfig.json` + `vite.config.ts` | Replaces fragile `../` relative imports with `@/lib/assets`, `@/state/AuthContext`, etc. Would simplify all future refactors. |
| Rename `src/screens/` → `src/pages/` | Aligns with Next.js/Remix conventions if future migration is planned. |
| Add `src/types/` shared types directory | `src/state/types.ts` and `src/services/types.ts` could share a common `src/types/` for domain types like `Load`, `DriverProfile`, etc. |

---

## 7. Summary of Changes

| Action | Count | Risk |
|--------|-------|------|
| PNG files moved to `docs/screenshots/` | 24 | **None** — no code references PNGs |
| Temp output files deleted | 3 | **None** — already gitignored |
| Dead mock files deleted | 2 | **None** — zero imports |
| `src/assets.ts` moved to `src/lib/assets.ts` | 1 | **Low** — 4 import updates |
| Import path updates | 4 lines in 4 files | **Low** — exact path replacements |
| `.gitignore` cleanup | 6 lines removed | **None** |
| **Total source files modified** | **4** | — |
| **Total source files deleted** | **2** (dead code) | — |
| **Build/test impact** | **Zero** | Verified by import analysis |

---

## 8. Execution Order

1. **Create** `docs/screenshots/` directory
2. **Move** all 24 PNG files from root → `docs/screenshots/`
3. **Delete** `test-output.txt`, `test-output2.txt`, `test-output3.txt`
4. **Move** `src/assets.ts` → `src/lib/assets.ts`
5. **Update** 4 import paths (see Section 3, Phase 2.2)
6. **Delete** `src/__tests__/__mocks__/i18next.ts` and `src/__tests__/mocks/i18n.ts`
7. **Remove** empty `__mocks__/` and `mocks/` directories
8. **Clean** `.gitignore` entries
9. **Run** `npm run typecheck && npm run test:run && npm run build`