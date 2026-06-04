# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> Offline Mode >> app remains functional when offline
- Location: e2e\offline.spec.ts:43:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#nav-tab-loads')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#nav-tab-loads')

```

```yaml
- text: ⚠️
- heading "Something went wrong" [level=1]
- paragraph: An unexpected error occurred. Please try again.
- button "Retry"
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
  17  |         // By default, should be online
  18  |         const offlineBanner = page.getByText(/you're offline|offline/i);
  19  |         await expect(offlineBanner).not.toBeVisible({ timeout: 3000 });
  20  |     });
  21  | 
  22  |     test('offline indicator appears when offline', async ({ page }) => {
  23  |         // Simulate going offline
  24  |         await page.context().setOffline(true);
  25  |         await page.waitForTimeout(1000);
  26  |         const offlineBanner = page.getByText(/you're offline|offline/i);
  27  |         await expect(offlineBanner).toBeVisible({ timeout: 5000 });
  28  |     });
  29  | 
  30  |     test('offline indicator disappears when back online', async ({ page }) => {
  31  |         // Go offline first
  32  |         await page.context().setOffline(true);
  33  |         await page.waitForTimeout(1000);
  34  |         const offlineBanner = page.getByText(/you're offline|offline/i);
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
  47  |         // Should still be able to navigate between tabs
  48  |         await page.locator('#nav-tab-loads').click();
  49  |         await page.waitForTimeout(1000);
  50  |         // Should still show loads tab content
> 51  |         await expect(page.locator('#nav-tab-loads')).toBeVisible({ timeout: 5000 });
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  52  | 
  53  |         await page.locator('#nav-tab-earnings').click();
  54  |         await page.waitForTimeout(1000);
  55  |         await expect(page.locator('#nav-tab-earnings')).toBeVisible({ timeout: 5000 });
  56  | 
  57  |         // Restore online
  58  |         await page.context().setOffline(false);
  59  |     });
  60  | 
  61  |     test('online toggle still works when offline', async ({ page }) => {
  62  |         await page.context().setOffline(true);
  63  |         await page.waitForTimeout(1000);
  64  | 
  65  |         // Toggle should still be clickable
  66  |         const toggle = page.locator('#online-toggle');
  67  |         await expect(toggle).toBeVisible({ timeout: 5000 });
  68  |         await toggle.click();
  69  |         await page.waitForTimeout(500);
  70  | 
  71  |         await page.context().setOffline(false);
  72  |     });
  73  | 
  74  |     test('offline indicator appears on all tab screens', async ({ page }) => {
  75  |         await page.context().setOffline(true);
  76  |         await page.waitForTimeout(1000);
  77  | 
  78  |         const offlineBanner = page.getByText(/you're offline|offline/i);
  79  | 
  80  |         // Home
  81  |         await expect(offlineBanner).toBeVisible({ timeout: 5000 });
  82  | 
  83  |         // Loads
  84  |         await page.locator('#nav-tab-loads').click();
  85  |         await page.waitForURL(/\/loads/, { timeout: 5000 });
  86  |         await expect(offlineBanner).toBeVisible({ timeout: 3000 });
  87  | 
  88  |         // Earnings
  89  |         await page.locator('#nav-tab-earnings').click();
  90  |         await page.waitForURL(/\/earnings/, { timeout: 5000 });
  91  |         await expect(offlineBanner).toBeVisible({ timeout: 3000 });
  92  | 
  93  |         // Profile
  94  |         await page.locator('#nav-tab-profile').click();
  95  |         await page.waitForURL(/\/profile/, { timeout: 5000 });
  96  |         await expect(offlineBanner).toBeVisible({ timeout: 3000 });
  97  | 
  98  |         await page.context().setOffline(false);
  99  |     });
  100 | });
```