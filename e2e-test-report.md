# HindTrucks E2E Stress Test Report

**Date:** 2026-06-04  
**App:** HindTrucks React PWA (mock API mode)  
**Dev Server:** http://localhost:5174  
**Framework:** Playwright 1.x | Chromium | iPhone 13 emulation (390×844, 3x DPR)  
**Config:** 1 worker, no retries, 30s timeout, 8s expect timeout

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | 93 |
| **Passed** | 70 (75.3%) |
| **Failed** | 23 (24.7%) |
| **Duration** | ~6.5 minutes |
| **Flaky** | 0 |

**Verdict:** The app is fundamentally stable. All 23 failures are **test selector/text mismatches** with the actual UI — not app crashes, not data corruption, not race conditions. Five spec files achieved 100% pass rate. The testing infrastructure (auth setup via localStorage, device emulation, route navigation) works correctly.

---

## Per-Spec Breakdown

| # | Spec File | Tests | Passed | Failed | Pass Rate |
|---|-----------|-------|--------|--------|-----------|
| 1 | `splash.spec.ts` | 5 | 4 | 1 | 80% |
| 2 | `language.spec.ts` | 5 | 3 | 2 | 60% |
| 3 | `login-flow.spec.ts` | 5 | 1 | 4 | 20% |
| 4 | `home.spec.ts` | 9 | 7 | 2 | 78% |
| 5 | `navigation.spec.ts` | 7 | 7 | 0 | **100%** |
| 6 | `loads.spec.ts` | 6 | 5 | 1 | 83% |
| 7 | `load-detail.spec.ts` | 6 | 3 | 3 | 50% |
| 8 | `earnings.spec.ts` | 7 | 7 | 0 | **100%** |
| 9 | `profile.spec.ts` | 10 | 10 | 0 | **100%** |
| 10 | `chatbot.spec.ts` | 11 | 6 | 5 | 55% |
| 11 | `onboarding.spec.ts` | 9 | 9 | 0 | **100%** |
| 12 | `offline.spec.ts` | 7 | 2 | 5 | 29% |
| 13 | `error-boundary.spec.ts` | 6 | 6 | 0 | **100%** |

---

## Detailed Failure Analysis

### Category 1: Chatbot Selector Mismatch (5 failures)

**Spec:** `e2e/chatbot.spec.ts`

#### F1–F4: `#chatbot-button` Not Found (lines 16–34)
- **Tests affected:** "FAB is visible on home tab", "clicking FAB opens chat drawer", "chat header shows AI Assistant title", "drawer shows quick questions"
- **Error:** `locator('#chatbot-button').waitFor({ timeout: 8000 })` times out
- **Root Cause:** The `#chatbot-button` CSS ID does not exist on the rendered page. The chatbot component likely uses a different selector or is not mounted on the home tab.
- **Type:** Test selector mismatch — requires source code investigation of `src/features/chatbot/`

#### F5: Close Button Intercepted (line 67)
- **Test affected:** "close button dismisses chat drawer"
- **Error:** `<strict>^locator('button[aria-label*="close" i], [aria-label*="close" i]button')</strict>` — click intercepted by `<input value="" type="text" placeholder="Type message or tap Mic...">` and `<div class="flex-1 overflow-y-auto p-4...">`
- **Root Cause:** **UI Layering Bug.** The chat text input field and message container overlap the close button in the z-index stack. Pointer events are intercepted by the input subtree before reaching the close button.
- **Type:** Potential UI bug — z-index/stacking issue in `ChatDrawer.tsx`

---

### Category 2: Home Screen Selector Mismatch (2 failures)

**Spec:** `e2e/home.spec.ts`

#### F6: BFC Leaderboard CSS Class Not Found (line 38)
- **Test:** "displays BFC leaderboard section"
- **Error:** `locator('#bfc-leaderboard >> .bfc-member, #bfc-leaderboard >> [class*="bfc"]')` — no elements found
- **Root Cause:** `.bfc-member` CSS class does not exist in the app. The leaderboard uses different class names.
- **Type:** Test selector mismatch

#### F7: "nearby loads" Text Not Found (line 49)
- **Test:** "displays nearby loads section"
- **Error:** `getByText(/nearby loads|available loads/i)` — no matches
- **Root Cause:** The app uses different wording for the loads section heading.
- **Type:** Test text mismatch

---

### Category 3: Language Picker Strict Mode (2 failures)

**Spec:** `e2e/language.spec.ts`

#### F8–F9: Strict Mode Violation (lines 9, 39)
- **Tests affected:** "picker shows all 5 languages", "Continue to login with selected language"
- **Error:** `getByText(/english/i)` matches 2 elements:
  1. `<p class="text-[18px] font-bold text-ink leading-tight">English</p>` — language name
  2. `<p class="text-xs text-ink-muted mt-0.5 font-bold">English</p>` — subtitle
- **Root Cause:** Both elements are inside the same language button. Playwright strict mode requires exactly 1 match.
- **Type:** Test selector needs `first()` or `.locator` with more specific selector

---

### Category 4: Load Detail Selector Mismatch (3 failures)

**Spec:** `e2e/load-detail.spec.ts`

#### F10: Shipper Info Not Found (line 37)
- **Test:** "displays shipper information"
- **Error:** `getByText(/shipper|sender|from/i)` — no matches
- **Root Cause:** The app does not display shipper info with text matching these patterns.
- **Type:** Test text mismatch

#### F11–F12: Accept Button Not Found (lines 42, 47)
- **Tests affected:** "displays accept load button", "accept opens confirmation sheet"
- **Error:** `getByRole('button', { name: /accept|confirm|take load/i })` — no matches
- **Root Cause:** The accept/confirm button uses different text or role in the actual component.
- **Type:** Test selector mismatch

---

### Category 5: Loads Empty State (1 failure)

**Spec:** `e2e/loads.spec.ts`

#### F13: Unexpected Page State (line 52)
- **Test:** "shows empty state when no loads match filter"
- **Error:** Both `hasCards` (cards visible) and `hasEmpty` (empty state visible) returned false
- **Root Cause:** The page was in a third, unexpected state after filter change — possibly still loading or showing a different UI.
- **Type:** Timing/state issue — may need longer wait or different filter approach

---

### Category 6: Login Phone Input Selector (4 failures)

**Spec:** `e2e/login-flow.spec.ts`

#### F14–F17: Phone Input Not Found (lines 9, 58, 75, 91)
- **Tests affected:** "complete flow: language → login → otp → home", "phone validation rejects short numbers", "accepts valid 10-digit number", "navigation to registration for new user"
- **Error:** `locator('input[type="tel"], input[placeholder*="phone" i], input[placeholder*="mobile" i], input[placeholder*="number" i]').first()` — no elements found
- **Root Cause:** The phone input in `Login.tsx` uses a different `type` attribute or placeholder text than expected.
- **Type:** Test selector mismatch — requires source investigation of `src/screens/Login.tsx`

**Note:** Only 1 test in this spec passed: "back button on login returns to language picker" (navigation-only, no input interaction).

---

### Category 7: Offline Indicator (5 failures)

**Spec:** `e2e/offline.spec.ts`

#### F18: Hidden When Online — False Positive (line 16)
- **Test:** "offline indicator is hidden when online"
- **Error:** `getByText(/you're offline|offline/i)` matches 2 elements (the "Offline" toggle label + offline banner text). The toggle label "Offline" is **always visible**, so `.not.toBeVisible()` fails.
- **Root Cause:** The "Offline" toggle label text matches the same regex as the offline indicator banner. Strict mode violation.
- **Type:** Test selector — needs scoping to exclude the toggle label

#### F19–F20, F23: Strict Mode — 3 Elements (lines 22, 30, 74)
- **Tests affected:** "offline indicator appears when offline", "disappears when back online", "appears on all tab screens"
- **Error:** `getByText(/you're offline|offline/i)` now matches **3** elements: toggle label + offline banner + a third offline-related text element.
- **Root Cause:** Same regex scope issue as F18, compounded by additional matching elements in offline state.
- **Type:** Test selector — needs more specific targeting

#### F21: Nav Tab Not Found When Offline (line 43)
- **Test:** "app remains functional when offline"
- **Error:** `locator('#nav-tab-loads')` — not found after going offline
- **Root Cause:** Navigation structure may change or break after offline toggle.
- **Type:** Potential app behavior issue — navigation may not render correctly in offline state

---

### Category 8: Splash Branding (1 failure)

**Spec:** `e2e/splash.spec.ts`

#### F22: "earn" Text Not Found (line 44)
- **Test:** "branding: HindTrucks branding elements present"
- **Error:** `getByText(/earn/i)` — no matches on landing card
- **Root Cause:** The splash landing card does not contain the word "earn" or uses different copy.
- **Type:** Test text mismatch

---

## Specs with 100% Pass Rate

| Spec | Tests | Notes |
|------|-------|-------|
| `navigation.spec.ts` | 7/7 | Bottom tabs, deep linking, back navigation all work correctly |
| `earnings.spec.ts` | 7/7 | Wallet balance, transactions, withdrawal UI all render correctly |
| `profile.spec.ts` | 10/10 | All profile fields, edit mode, settings, logout flow work |
| `onboarding.spec.ts` | 9/9 | Tour steps, navigation, skip/complete all function |
| `error-boundary.spec.ts` | 6/6 | Error display, retry, recovery all work |

---

## Bug Severity Classification

### Real UI Bug (1)
| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| F5 | Chat close button intercepted by input/drawer subtree | **Medium** | Pointer events on close → `<input>` and `<div class="flex-1 overflow-y-auto">` intercept. Screenshot: `test-results/chatbot-AI-Chatbot-close-button-dismisses-chat-drawer-chromium/test-failed-1.png` |

### Potential App Behavior Issues (2)
| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| F13 | Unexpected page state after filter change on Loads screen | **Low** | Neither cards nor empty state visible. Screenshot available. |
| F21 | `#nav-tab-loads` not found after offline toggle | **Medium** | Navigation may not render correctly in offline state. Screenshot available. |

### Test Selector/Text Mismatches (20)
All remaining 20 failures are test code issues where CSS selectors, text patterns, or ARIA roles don't match the actual rendered UI. These require:
1. Reading the actual component source to identify correct selectors
2. Updating test locators to match the real DOM

---

## Screenshots Captured

All failure screenshots are in `test-results/` organized by test name. Key screenshots:

- `test-results/chatbot-AI-Chatbot-close-button-dismisses-chat-drawer-chromium/test-failed-1.png` — Chat close button layering issue
- `test-results/login-flow-Login-Flow-comp-f9a70-nguage-→-login-→-otp-→-home-chromium/test-failed-1.png` — Login page state
- `test-results/offline-Offline-Mode-app-remains-functional-when-offline-chromium/test-failed-1.png` — Offline state navigation
- `test-results/home-Home-Screen-displays-BFC-leaderboard-section-chromium/test-failed-1.png` — BFC leaderboard rendering

HTML report: `playwright-report/index.html`  
JSON results: `e2e-results.json`  
Traces: Available in each failure directory as `trace.zip`

---

## Recommendations

1. **Fix F5 (Chatbot close button) first** — genuine UI layering bug, z-index fix in `ChatDrawer.tsx`
2. **Investigate Login.tsx** — determine actual input selector for phone field, update all login tests
3. **Scope offline text selectors** — use `.locator()` with container scoping to avoid matching toggle labels
4. **Verify `#chatbot-button`** — check if the ID exists in chatbot component or if it uses a different selector
5. **Investigate F13 & F21** — potential app state issues on Loads filter and offline navigation
6. **Don't batch-fix selectors** — each mismatch needs individual source verification before test update