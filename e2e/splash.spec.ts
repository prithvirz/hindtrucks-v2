import { test, expect } from '@playwright/test';

test.describe('Splash Screen', () => {
    test.beforeEach(async ({ page }) => {
        // Clear localStorage to ensure fresh state
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
    });

    test('displays splash animation on load', async ({ page }) => {
        await page.goto('/');
        // Should show the app logo / splash content
        await expect(page.locator('text=HindTrucks')).toBeVisible({ timeout: 3000 });
    });

    test('shows landing card with Get Started button after animation', async ({ page }) => {
        await page.goto('/');
        // Wait for the landing card to appear after 1.5s animation
        const getStarted = page.getByRole('button', { name: /get started/i });
        await expect(getStarted).toBeVisible({ timeout: 4000 });
    });

    test('Get Started button navigates to language picker', async ({ page }) => {
        await page.goto('/');
        const getStarted = page.getByRole('button', { name: /get started/i });
        await expect(getStarted).toBeVisible({ timeout: 4000 });
        await getStarted.click();
        await expect(page).toHaveURL(/\/language/);
    });

    test('auto-redirects to home when already logged in', async ({ page }) => {
        // Set auth flag before navigating
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('ht_auth', '1');
            localStorage.setItem('ht_registered_9876543210', '1');
            localStorage.setItem('ht_tour', '1');
        });
        await page.goto('/');
        // Should redirect to /home after 1.5s
        await page.waitForURL(/\/home/, { timeout: 5000 });
    });

    test('landing card has correct branding elements', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000); // Wait for landing card
        // Landing card shows "Driver Application" and value props
        await expect(page.getByText(/driver application/i)).toBeVisible({ timeout: 3000 });
        await expect(page.getByText(/high-paying|logistics|wallet/i).first()).toBeVisible({ timeout: 3000 });
    });
});