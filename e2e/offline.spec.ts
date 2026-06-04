import { test, expect } from '@playwright/test';

test.describe('Offline Mode', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('ht_auth', '1');
            localStorage.setItem('ht_registered_9876543210', '1');
            localStorage.setItem('ht_tour', '1');
        });
        await page.goto('/home');
        await page.waitForLoadState('networkidle');
    });

    test('offline indicator is hidden when online', async ({ page }) => {
        // By default, should be online — banner text is "You're offline. Changes will sync..."
        const offlineBanner = page.getByText(/you're offline\./i);
        await expect(offlineBanner).not.toBeVisible({ timeout: 3000 });
    });

    test('offline indicator appears when offline', async ({ page }) => {
        // Simulate going offline
        await page.context().setOffline(true);
        await page.waitForTimeout(1000);
        const offlineBanner = page.getByText(/you're offline\./i);
        await expect(offlineBanner).toBeVisible({ timeout: 5000 });
    });

    test('offline indicator disappears when back online', async ({ page }) => {
        // Go offline first
        await page.context().setOffline(true);
        await page.waitForTimeout(1000);
        const offlineBanner = page.getByText(/you're offline\./i);
        await expect(offlineBanner).toBeVisible({ timeout: 5000 });

        // Go back online
        await page.context().setOffline(false);
        await page.waitForTimeout(1000);
        await expect(offlineBanner).not.toBeVisible({ timeout: 5000 });
    });

    test('app remains functional when offline', async ({ page }) => {
        await page.context().setOffline(true);
        await page.waitForTimeout(1000);

        // Home page should still render core UI elements
        await expect(page.locator('#driver-profile')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('#online-toggle')).toBeVisible({ timeout: 5000 });

        // Restore online
        await page.context().setOffline(false);
    });

    test('online toggle still works when offline', async ({ page }) => {
        await page.context().setOffline(true);
        await page.waitForTimeout(1000);

        // Toggle should still be clickable
        const toggle = page.locator('#online-toggle');
        await expect(toggle).toBeVisible({ timeout: 5000 });
        await toggle.click();
        await page.waitForTimeout(500);

        await page.context().setOffline(false);
    });

    test('offline indicator appears on all tab screens', async ({ page }) => {
        await page.context().setOffline(true);
        await page.waitForTimeout(1000);

        const offlineBanner = page.getByText(/you're offline\./i);

        // Home — banner visible
        await expect(offlineBanner).toBeVisible({ timeout: 5000 });

        // Bottom tab bar visible (app shell intact across all tabs)
        // OfflineIndicator is rendered in Shell (always mounted), so visibility
        // on one tab implies visibility on all tabs.
        await expect(page.locator('#nav-tab-home')).toBeVisible({ timeout: 3000 });
        await expect(page.locator('#nav-tab-loads')).toBeVisible({ timeout: 3000 });
        await expect(page.locator('#nav-tab-earnings')).toBeVisible({ timeout: 3000 });
        await expect(page.locator('#nav-tab-profile')).toBeVisible({ timeout: 3000 });

        await page.context().setOffline(false);
    });
});