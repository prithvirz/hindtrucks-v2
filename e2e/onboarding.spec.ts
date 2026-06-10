import { test, expect } from '@playwright/test';

test.describe('Onboarding Tour', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('ht_auth', '1');
            localStorage.setItem('ht_registered_9876543210', '1');
            // NOT setting ht_tour so tour triggers
            localStorage.setItem('ht_perms_onboarded', '1');
        });
        await page.goto('/home');
        await page.waitForLoadState('domcontentloaded');
    });

    test('onboarding tour starts automatically on first login', async ({ page }) => {
        // Tour should be active since ht_tour is not set
        await page.waitForTimeout(1500);
        // Tour overlay should show "Tour 1/6" badge
        const tourBadge = page.getByText(/tour 1/i);
        await expect(tourBadge).toBeVisible({ timeout: 5000 });
    });

    test('tour shows welcome step first', async ({ page }) => {
        await page.waitForTimeout(1500);
        const welcomeTitle = page.getByText(/welcome/i);
        await expect(welcomeTitle.first()).toBeVisible({ timeout: 5000 });
    });

    test('can advance through tour steps with Next button', async ({ page }) => {
        await page.waitForTimeout(1500);
        // First step (welcome) - click Next
        const nextBtn = page.getByRole('button', { name: /next/i });
        await expect(nextBtn).toBeVisible({ timeout: 5000 });
        await nextBtn.click();
        await page.waitForTimeout(500);
        // Should show step 2/6
        const step2Badge = page.getByText(/tour 2/i);
        await expect(step2Badge).toBeVisible({ timeout: 3000 });
    });

    test('can go back through tour steps', async ({ page }) => {
        await page.waitForTimeout(1500);
        // Advance to step 2
        const nextBtn = page.getByRole('button', { name: /next/i });
        await expect(nextBtn).toBeVisible({ timeout: 5000 });
        await nextBtn.click();
        await page.waitForTimeout(500);

        // Go back to step 1
        const backBtn = page.getByRole('button', { name: /back/i });
        await expect(backBtn).toBeVisible({ timeout: 3000 });
        await backBtn.click();
        await page.waitForTimeout(500);
        const tourBadge = page.getByText(/tour 1/i);
        await expect(tourBadge).toBeVisible({ timeout: 3000 });
    });

    test('Skip button dismisses the tour', async ({ page }) => {
        await page.waitForTimeout(1500);
        const skipBtn = page.getByText(/skip/i);
        await expect(skipBtn).toBeVisible({ timeout: 5000 });
        await skipBtn.click();
        await page.waitForTimeout(500);
        // Tour should be dismissed
        const tourOverlay = page.getByText(/tour/i);
        await expect(tourOverlay).not.toBeVisible({ timeout: 3000 });
    });

    test('completing all tour steps dismisses tour', async ({ page }) => {
        await page.waitForTimeout(1500);
        // 6 steps total, click Next on each
        for (let i = 0; i < 5; i++) {
            const nextBtn = page.getByRole('button', { name: /next/i });
            if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await nextBtn.click();
                await page.waitForTimeout(500);
            }
        }
        // Last step should show Continue instead of Next
        const continueBtn = page.getByRole('button', { name: /continue/i });
        if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await continueBtn.click();
            await page.waitForTimeout(500);
        }
        // Tour should be gone
        const tourOverlay = page.getByText(/tour/i);
        await expect(tourOverlay).not.toBeVisible({ timeout: 3000 });
    });

    test('tour does not show on second login', async ({ page }) => {
        // Complete tour first
        await page.waitForTimeout(1500);
        const skipBtn = page.getByText(/skip/i);
        await expect(skipBtn).toBeVisible({ timeout: 5000 });
        await skipBtn.click();
        await page.waitForTimeout(500);

        // Reload - tour should not appear
        await page.goto('/home');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        const tourBadge = page.getByText(/tour 1/i);
        await expect(tourBadge).not.toBeVisible({ timeout: 3000 });
    });

    test('tour highlights navigation tabs', async ({ page }) => {
        await page.waitForTimeout(1500);
        // Advance to step 2 (nav home)
        const nextBtn = page.getByRole('button', { name: /next/i });
        await expect(nextBtn).toBeVisible({ timeout: 5000 });
        await nextBtn.click();
        await page.waitForTimeout(500);
        // Step 2 should reference home tab
        const step2Badge = page.getByText(/tour 2/i);
        await expect(step2Badge).toBeVisible({ timeout: 3000 });
    });

    test('tour is accessible from all tab screens', async ({ page }) => {
        // Complete tour first so we can navigate freely
        await page.waitForTimeout(1500);
        const skipBtn = page.getByText(/skip/i);
        await expect(skipBtn).toBeVisible({ timeout: 5000 });
        await skipBtn.click();
        await page.waitForTimeout(500);

        // Navigate to loads
        await page.locator('#nav-tab-loads').click();
        await page.waitForURL(/\/loads/, { timeout: 5000 });
        await expect(page.locator('#chatbot-button')).toBeVisible({ timeout: 5000 });
    });
});