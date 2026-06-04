# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> Offline Mode >> offline indicator appears on all tab screens
- Location: e2e\offline.spec.ts:68:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/you're offline\./i)
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for getByText(/you're offline\./i)

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Offline Mode', () => {
  4   |     test.beforeEach(async ({ page }) => {
  5   |         await page.goto('/');
  6   |         await page.evaluate(() => {
  7   |             localStorage.clear();
  8   |             localStorage.setItem('ht_auth', '1');
  9   |             localStorage.setItem('ht_registered_9876543210', '1');
  10  |             localStorage.setItem('ht_tour', '1');
  11  |         });
  12  |         await page.goto('/home');
  13  |         await page.waitForLoadState('networkidle');
  14  |     });
  15  | 
  16  |     test('offline indicator is hidden when online', async ({ page }) => {
  17  |         // By default, should be online — banner text is "You're offline. Changes will sync..."
  18  |         const offlineBanner = page.getByText(/you're offline\./i);
  19  |         await expect(offlineBanner).not.toBeVisible({ timeout: 3000 });
  20  |     });
  21  | 
  22  |     test('offline indicator appears when offline', async ({ page }) => {
  23  |         // Simulate going offline
  24  |         await page.context().setOffline(true);
  25  |         await page.waitForTimeout(1000);
  26  |         const offlineBanner = page.getByText(/you're offline\./i);
  27  |         await expect(offlineBanner).toBeVisible({ timeout: 5000 });
  28  |     });
  29  | 
  30  |     test('offline indicator disappears when back online', async ({ page }) => {
  31  |         // Go offline first
  32  |         await page.context().setOffline(true);
  33  |         await page.waitForTimeout(1000);
  34  |         const offlineBanner = page.getByText(/you're offline\./i);
  35  |         await expect(offlineBanner).toBeVisible({ timeout: 5000 });
  36  | 
  37  |         // Go back online
  38  |         await page.context().setOffline(false);
  39  |         await page.waitForTimeout(1000);
  40  |         await expect(offlineBanner).not.toBeVisible({ timeout: 5000 });
  41  |     });
  42  | 
  43  |     test('app remains functional when offline', async ({ page }) => {
  44  |         await page.context().setOffline(true);
  45  |         await page.waitForTimeout(1000);
  46  | 
  47  |         // Home page should still render core UI elements
  48  |         await expect(page.locator('#driver-profile')).toBeVisible({ timeout: 5000 });
  49  |         await expect(page.locator('#online-toggle')).toBeVisible({ timeout: 5000 });
  50  | 
  51  |         // Restore online
  52  |         await page.context().setOffline(false);
  53  |     });
  54  | 
  55  |     test('online toggle still works when offline', async ({ page }) => {
  56  |         await page.context().setOffline(true);
  57  |         await page.waitForTimeout(1000);
  58  | 
  59  |         // Toggle should still be clickable
  60  |         const toggle = page.locator('#online-toggle');
  61  |         await expect(toggle).toBeVisible({ timeout: 5000 });
  62  |         await toggle.click();
  63  |         await page.waitForTimeout(500);
  64  | 
  65  |         await page.context().setOffline(false);
  66  |     });
  67  | 
  68  |     test('offline indicator appears on all tab screens', async ({ page }) => {
  69  |         await page.context().setOffline(true);
  70  |         await page.waitForTimeout(1000);
  71  | 
  72  |         const offlineBanner = page.getByText(/you're offline\./i);
  73  | 
  74  |         // Home
  75  |         await expect(offlineBanner).toBeVisible({ timeout: 5000 });
  76  | 
  77  |         // Use client-side history navigation — page.goto fails with ERR_INTERNET_DISCONNECTED when offline
  78  |         await page.evaluate(() => {
  79  |             window.history.pushState({}, '', '/loads');
  80  |             window.dispatchEvent(new PopStateEvent('popstate'));
  81  |         });
  82  |         await page.waitForTimeout(1000);
> 83  |         await expect(offlineBanner).toBeVisible({ timeout: 3000 });
      |                                     ^ Error: expect(locator).toBeVisible() failed
  84  | 
  85  |         await page.evaluate(() => {
  86  |             window.history.pushState({}, '', '/earnings');
  87  |             window.dispatchEvent(new PopStateEvent('popstate'));
  88  |         });
  89  |         await page.waitForTimeout(1000);
  90  |         await expect(offlineBanner).toBeVisible({ timeout: 3000 });
  91  | 
  92  |         await page.evaluate(() => {
  93  |             window.history.pushState({}, '', '/profile');
  94  |             window.dispatchEvent(new PopStateEvent('popstate'));
  95  |         });
  96  |         await page.waitForTimeout(1000);
  97  |         await expect(offlineBanner).toBeVisible({ timeout: 3000 });
  98  | 
  99  |         await page.context().setOffline(false);
  100 |     });
  101 | });
```