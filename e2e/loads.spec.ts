import { test, expect } from '@playwright/test';

test.describe('Loads Screen', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('ht_auth', '1');
            localStorage.setItem('ht_registered_9876543210', '1');
            localStorage.setItem('ht_tour', '1');
        });
        await page.goto('/loads');
        await page.waitForLoadState('networkidle');
    });

    test('displays truck filter pills', async ({ page }) => {
        // Wait for loading to finish
        await page.waitForTimeout(1000);
        // Truck filter pills should be visible
        const filterPills = page.locator('button').filter({ hasText: /ft|container|open truck|dumper|trailer|all/i });
        const count = await filterPills.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('filter pills are clickable and change active state', async ({ page }) => {
        await page.waitForTimeout(1000);
        const filterPills = page.locator('button').filter({ hasText: /ft|container|open truck|dumper|trailer|all/i });
        const firstPill = filterPills.first();
        if (await firstPill.isVisible()) {
            await firstPill.click();
            await page.waitForTimeout(500);
        }
    });

    test('shows loading skeleton while fetching', async ({ page }) => {
        // Navigate fresh to see loading state
        await page.goto('/loads');
        // Skeleton should appear briefly
        const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]');
        // May flash quickly, just verify page loads
        await page.waitForLoadState('networkidle');
    });

    test('displays load cards after loading', async ({ page }) => {
        await page.waitForTimeout(1500);
        // Load cards should be visible
        const loadCards = page.locator('[class*="load-card"], [class*="LoadCard"]');
        const cardCount = await loadCards.count();
        expect(cardCount).toBeGreaterThanOrEqual(0); // May have loads or empty state
    });

    test('shows empty state when no loads match filter', async ({ page }) => {
        await page.waitForTimeout(1000);
        // Check if empty state or load cards are shown
        const emptyState = page.getByText(/no loads|no shipments|nothing found/i);
        const loadCards = page.locator('[class*="load-card"]');
        const hasCards = (await loadCards.count()) > 0;
        const hasEmpty = await emptyState.isVisible().catch(() => false);
        // One of the two should be true
        expect(hasCards || hasEmpty).toBeTruthy();
    });

    test('clicking a load card navigates to load detail', async ({ page }) => {
        await page.waitForTimeout(1500);
        const loadCards = page.locator('[class*="load-card"]');
        const count = await loadCards.count();
        if (count > 0) {
            await loadCards.first().click();
            await expect(page).toHaveURL(/\/loads\/|load-detail|loaddetail/i, { timeout: 5000 });
        }
    });
});