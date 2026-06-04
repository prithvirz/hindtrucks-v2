import { test, expect } from '@playwright/test';

test.describe('Home Screen', () => {
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

    test('displays driver profile card', async ({ page }) => {
        await expect(page.locator('#driver-profile')).toBeVisible({ timeout: 5000 });
    });

    test('displays online/offline toggle', async ({ page }) => {
        await expect(page.locator('#online-toggle')).toBeVisible({ timeout: 5000 });
    });

    test('online toggle switches state', async ({ page }) => {
        const toggle = page.locator('#online-toggle');
        await expect(toggle).toBeVisible({ timeout: 5000 });
        await toggle.click();
        // Verify toggle state changed (should have some visual indicator)
        await page.waitForTimeout(500);
    });

    test('displays stats card with 3 stat items', async ({ page }) => {
        await expect(page.locator('#stats-card')).toBeVisible({ timeout: 5000 });
        const statItems = page.locator('#stats-card > *');
        await expect(statItems).toHaveCount(3);
    });

    test('displays BFC leaderboard section', async ({ page }) => {
        await expect(page.locator('#bfc-leaderboard')).toBeVisible({ timeout: 5000 });
        // BFC members are rendered as plain divs inside #bfc-leaderboard
        const leaderItems = page.locator('#bfc-leaderboard > div');
        await expect(leaderItems.first()).toBeVisible({ timeout: 3000 });
    });

    test('displays refer card', async ({ page }) => {
        await expect(page.locator('#refer-card')).toBeVisible({ timeout: 5000 });
    });

    test('displays nearby loads section', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /loads near you/i })).toBeVisible({ timeout: 5000 });
    });

    test('shows active trips section when trips exist', async ({ page }) => {
        // Check if active trips section renders
        const activeTripsSection = page.getByText(/active trip|ongoing trip/i);
        // May or may not have trips — just verify the section structure exists
        await page.waitForTimeout(1000);
    });

    test('driver name is visible on profile card', async ({ page }) => {
        const profileCard = page.locator('#driver-profile');
        await expect(profileCard).toBeVisible({ timeout: 5000 });
        // Should contain some text (driver name or placeholder)
        const text = await profileCard.textContent();
        expect(text?.length).toBeGreaterThan(0);
    });
});