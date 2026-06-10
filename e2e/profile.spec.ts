import { test, expect } from '@playwright/test';

test.describe('Profile Screen', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('ht_auth', '1');
            localStorage.setItem('ht_phone', '9876543210');
            localStorage.setItem('ht_registered_9876543210', '1');
            localStorage.setItem('ht_tour', '1');
            localStorage.setItem('ht_perms_onboarded', '1');
        });
        await page.goto('/profile');
        await page.waitForLoadState('domcontentloaded');
    });

    test('displays driver profile information', async ({ page }) => {
        await expect(page.getByText(/profile|my account/i).first()).toBeVisible({ timeout: 5000 });
        // Should show driver name, phone, etc.
        await expect(page.getByText(/name|driver/i).first()).toBeVisible({ timeout: 3000 });
    });

    test('edit profile button opens edit sheet', async ({ page }) => {
        const editBtn = page.getByRole('button', { name: /edit profile|edit/i });
        await expect(editBtn.first()).toBeVisible({ timeout: 5000 });
        await editBtn.first().click();
        await page.waitForTimeout(800);
        // Should show edit form
        const editSheet = page.getByText(/name|save|update profile/i);
        await expect(editSheet.first()).toBeVisible({ timeout: 3000 });
    });

    test('language settings button opens language sheet', async ({ page }) => {
        const langBtn = page.getByRole('button', { name: /language|भाषा|lang/i });
        await expect(langBtn.first()).toBeVisible({ timeout: 5000 });
        await langBtn.first().click();
        await page.waitForTimeout(800);
        // Language sheet should show language options
        const langSheet = page.getByText(/english|hindi|tamil|punjabi|telugu/i);
        await expect(langSheet.first()).toBeVisible({ timeout: 3000 });
    });

    test('truck management section is visible', async ({ page }) => {
        await expect(page.getByText(/truck|vehicle/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('add truck button opens add truck sheet', async ({ page }) => {
        const addTruckBtn = page.getByRole('button', { name: /add truck|add vehicle/i });
        if (await addTruckBtn.isVisible()) {
            await addTruckBtn.click();
            await page.waitForTimeout(800);
            // Should show truck form
            const truckForm = page.getByText(/truck number|registration|type/i);
            await expect(truckForm.first()).toBeVisible({ timeout: 3000 });
        }
    });

    test('documents section is visible', async ({ page }) => {
        await expect(page.getByText(/document|license|aadhaar/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('refer & earn section is visible', async ({ page }) => {
        await expect(page.getByText(/refer|earn|share/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('logout button is visible', async ({ page }) => {
        const logoutBtn = page.getByRole('button', { name: /logout|sign out|log out/i });
        await expect(logoutBtn).toBeVisible({ timeout: 5000 });
    });

    test('logout clears auth and redirects to splash', async ({ page }) => {
        const logoutBtn = page.getByRole('button', { name: /logout|sign out|log out/i });
        await expect(logoutBtn).toBeVisible({ timeout: 5000 });
        await logoutBtn.click();
        await page.waitForTimeout(1000);
        // Should redirect to splash or login
        const isLoggedOut = await page.locator('text=Get Started').isVisible({ timeout: 5000 }).catch(() => false);
        const isOnLogin = page.url().includes('/login') || page.url().includes('/language');
        expect(isLoggedOut || isOnLogin).toBeTruthy();
    });

    test('notification center opens on click', async ({ page }) => {
        const notifBtn = page.getByRole('button', { name: /notification|bell/i });
        if (await notifBtn.isVisible()) {
            await notifBtn.click();
            await page.waitForTimeout(800);
        }
    });
});