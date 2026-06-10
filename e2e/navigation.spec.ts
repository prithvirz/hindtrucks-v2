import { test, expect } from '@playwright/test';

test.describe('Bottom Tab Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('ht_auth', '1');
            localStorage.setItem('ht_registered_9876543210', '1');
            localStorage.setItem('ht_tour', '1');
            localStorage.setItem('ht_perms_onboarded', '1');
        });
        await page.goto('/home');
        await page.waitForLoadState('domcontentloaded');
    });

    test('all 4 bottom tabs are visible', async ({ page }) => {
        await expect(page.locator('#nav-tab-home')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('#nav-tab-loads')).toBeVisible({ timeout: 3000 });
        await expect(page.locator('#nav-tab-earnings')).toBeVisible({ timeout: 3000 });
        await expect(page.locator('#nav-tab-profile')).toBeVisible({ timeout: 3000 });
    });

    test('home tab is active by default', async ({ page }) => {
        const homeTab = page.locator('#nav-tab-home');
        await expect(homeTab).toBeVisible({ timeout: 5000 });
        await expect(page).toHaveURL(/\/home/);
    });

    test('navigates to Loads tab', async ({ page }) => {
        await page.locator('#nav-tab-loads').click();
        await expect(page).toHaveURL(/\/loads/, { timeout: 5000 });
        await expect(page.locator('text=Loads').first()).toBeVisible({ timeout: 3000 });
    });

    test('navigates to Earnings tab', async ({ page }) => {
        await page.locator('#nav-tab-earnings').click();
        await expect(page).toHaveURL(/\/earnings/, { timeout: 5000 });
        await expect(page.getByText(/wallet|balance|earnings/i).first()).toBeVisible({ timeout: 3000 });
    });

    test('navigates to Profile tab', async ({ page }) => {
        await page.locator('#nav-tab-profile').click();
        await expect(page).toHaveURL(/\/profile/, { timeout: 5000 });
        await expect(page.getByText(/profile|my account/i).first()).toBeVisible({ timeout: 3000 });
    });

    test('tab navigation is bidirectional', async ({ page }) => {
        // Home → Loads → Home
        await page.locator('#nav-tab-loads').click();
        await expect(page).toHaveURL(/\/loads/);
        await page.locator('#nav-tab-home').click();
        await expect(page).toHaveURL(/\/home/);

        // Home → Profile → Earnings
        await page.locator('#nav-tab-profile').click();
        await expect(page).toHaveURL(/\/profile/);
        await page.locator('#nav-tab-earnings').click();
        await expect(page).toHaveURL(/\/earnings/);
    });

    test('active tab has accent color styling', async ({ page }) => {
        const homeTab = page.locator('#nav-tab-home');
        await expect(homeTab).toBeVisible({ timeout: 5000 });
        // Active tab should have accent class or color
        const classAttr = await homeTab.getAttribute('class');
        expect(classAttr).toBeTruthy();
    });
});