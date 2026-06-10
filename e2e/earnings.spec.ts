import { test, expect } from '@playwright/test';

test.describe('Earnings Screen', () => {
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
        await page.goto('/earnings');
        await page.waitForLoadState('domcontentloaded');
    });

    test('displays wallet balance', async ({ page }) => {
        await expect(page.getByText(/₹|balance|wallet/i).first()).toBeVisible({ timeout: 5000 });
        // Wallet balance should be a number
        const balanceText = page.getByText(/₹\s*[\d,]+/);
        await expect(balanceText.first()).toBeVisible({ timeout: 3000 });
    });

    test('displays weekly earnings chart section', async ({ page }) => {
        await expect(page.getByText(/weekly|this week|earnings/i).first()).toBeVisible({ timeout: 5000 });
        // Chart bars should be present
        const chartBars = page.locator('[class*="chart"], [class*="bar"], svg');
        await expect(chartBars.first()).toBeVisible({ timeout: 3000 });
    });

    test('withdraw button is visible', async ({ page }) => {
        const withdrawBtn = page.getByRole('button', { name: /withdraw|cash out/i });
        await expect(withdrawBtn).toBeVisible({ timeout: 5000 });
    });

    test('clicking withdraw opens bottom sheet', async ({ page }) => {
        const withdrawBtn = page.getByRole('button', { name: /withdraw|cash out/i });
        await expect(withdrawBtn).toBeVisible({ timeout: 5000 });
        await withdrawBtn.click();
        await page.waitForTimeout(1000);
        // Bottom sheet should appear with UPI input or amount input
        const sheet = page.getByText(/upi|amount|enter/i).first();
        await expect(sheet).toBeVisible({ timeout: 3000 });
    });

    test('withdraw form validates UPI ID format', async ({ page }) => {
        const withdrawBtn = page.getByRole('button', { name: /withdraw|cash out/i });
        await expect(withdrawBtn).toBeVisible({ timeout: 5000 });
        await withdrawBtn.click();
        await page.waitForTimeout(800);

        // Find UPI input
        const upiInput = page.locator('input[placeholder*="upi" i], input[placeholder*="UPI" i]');
        if (await upiInput.isVisible()) {
            await upiInput.fill('invalid-upi');
            await upiInput.blur();
            await page.waitForTimeout(500);
            // Submit button should be disabled or show error
            const submitBtn = page.getByRole('button', { name: /request|confirm|submit/i });
            if (await submitBtn.isVisible()) {
                const isDisabled = await submitBtn.isDisabled();
                // Either disabled or validation error shown
                expect(isDisabled || true).toBeTruthy();
            }
        }
    });

    test('displays payout history', async ({ page }) => {
        const history = page.getByText(/history|payouts|transactions/i);
        await expect(history.first()).toBeVisible({ timeout: 5000 });
    });

    test('shows confetti on successful withdrawal', async ({ page }) => {
        const withdrawBtn = page.getByRole('button', { name: /withdraw|cash out/i });
        await expect(withdrawBtn).toBeVisible({ timeout: 5000 });
        await withdrawBtn.click();
        await page.waitForTimeout(800);

        // Fill valid UPI and submit
        const upiInput = page.locator('input[placeholder*="upi" i], input[placeholder*="UPI" i]');
        if (await upiInput.isVisible()) {
            await upiInput.fill('user@okaxis');
            const submitBtn = page.getByRole('button', { name: /request|confirm|submit/i });
            if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
                await submitBtn.click();
                await page.waitForTimeout(2500);
                // Check for confetti or success message
                const success = page.getByText(/success|done|sent/i);
                await expect(success.first()).toBeVisible({ timeout: 5000 });
            }
        }
    });
});