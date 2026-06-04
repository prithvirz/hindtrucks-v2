import { test, expect } from '@playwright/test';

test.describe('Load Detail Screen', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('ht_auth', '1');
            localStorage.setItem('ht_registered_9876543210', '1');
            localStorage.setItem('ht_tour', '1');
        });
        // Navigate to loads, then click first load card
        await page.goto('/loads');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        const loadCards = page.locator('[class*="load-card"]');
        const count = await loadCards.count();
        if (count > 0) {
            await loadCards.first().click();
            await page.waitForURL(/\/loads\/[a-zA-Z0-9-]+/i, { timeout: 5000 });
        }
        await page.waitForLoadState('networkidle');
    });

    test('displays load route information', async ({ page }) => {
        // Check for route info (origin/destination)
        const routeInfo = page.getByText(/to|→|destination|origin/i).first();
        await expect(routeInfo).toBeVisible({ timeout: 5000 });
    });

    test('displays load specifications', async ({ page }) => {
        // Check for load specs like weight, distance, etc.
        const specs = page.getByText(/ton|km|weight|distance|capacity/i).first();
        await expect(specs).toBeVisible({ timeout: 5000 });
    });

    test('displays shipper information', async ({ page }) => {
        const shipper = page.getByText(/shipper/i).first();
        await expect(shipper).toBeVisible({ timeout: 5000 });
    });

    test('displays accept load button', async ({ page }) => {
        const acceptBtn = page.getByRole('button', { name: /accept load/i });
        await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    });

    test('clicking accept opens confirmation sheet', async ({ page }) => {
        const acceptBtn = page.getByRole('button', { name: /accept load/i });
        await expect(acceptBtn).toBeVisible({ timeout: 5000 });
        await acceptBtn.click();
        // Should show confirmation bottom sheet
        await page.waitForTimeout(1000);
        const confirmSheet = page.getByText(/select vehicle|assign truck/i);
        // May or may not be visible depending on state
        await expect(confirmSheet.first()).toBeVisible({ timeout: 3000 });
    });

    test('displays payment split information', async ({ page }) => {
        const paymentInfo = page.getByText(/₹|INR|payment|fare|split/i).first();
        await expect(paymentInfo).toBeVisible({ timeout: 5000 });
    });
});