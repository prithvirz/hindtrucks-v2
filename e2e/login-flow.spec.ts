import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
    });

    test('complete login flow: splash → language → login → otp → home', async ({ page }) => {
        // 1. Splash → Language
        await page.goto('/');
        const getStarted = page.getByRole('button', { name: /get started/i });
        await expect(getStarted).toBeVisible({ timeout: 4000 });
        await getStarted.click();
        await expect(page).toHaveURL(/\/language/);

        // 2. Language → Login
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible();
        await continueBtn.click();
        await expect(page).toHaveURL(/\/auth/);

        // 2.5. Auth choice → Login
        const loginBtn = page.getByRole('button', { name: /login/i }).first();
        await expect(loginBtn).toBeVisible({ timeout: 3000 });
        await loginBtn.click();
        await expect(page).toHaveURL(/\/login/);

        // 3. Enter phone number — input has inputMode="numeric", no type attr, placeholder="98765 43210"
        const phoneInput = page.locator('input[inputmode="numeric"]').first();
        await expect(phoneInput).toBeVisible();
        await phoneInput.fill('9876543210');
        await phoneInput.blur();

        // 4. Click Send OTP
        const sendOtp = page.getByRole('button', { name: /send otp|get otp|continue/i });
        await expect(sendOtp).toBeEnabled({ timeout: 2000 });
        await sendOtp.click();

        // 5. OTP screen
        await expect(page).toHaveURL(/\/otp/, { timeout: 5000 });
        // OTP inputs: 6 <input inputMode="numeric"> elements — UI requires all 6 digits for verify button to enable
        const otpInputs = page.locator('input[inputmode="numeric"]');
        const otpCount = await otpInputs.count();
        if (otpCount >= 6) {
            for (let i = 0; i < 6; i++) {
                await otpInputs.nth(i).fill('1');
            }
        } else {
            await page.keyboard.type('111111');
        }

        // 5.5. Mark phone as registered so mock getRegistrationStatus returns true → routes to /home
        await page.evaluate(() => localStorage.setItem('ht_registered_9876543210', '1'));

        // 6. Click Verify & Continue — OTP does not auto-verify
        const verifyBtn = page.getByRole('button', { name: /verify/i });
        await expect(verifyBtn).toBeEnabled({ timeout: 2000 });
        await verifyBtn.click();

        // 7. Should navigate to home after OTP verify
        await page.waitForURL(/\/home/, { timeout: 10000 });
        await expect(page.locator('#driver-profile, [data-testid="driver-profile"]')).toBeVisible({ timeout: 5000 });
    });

    test('phone input validation: rejects short numbers', async ({ page }) => {
        await page.goto('/language');
        await page.waitForTimeout(500);
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 3000 });
        await continueBtn.click();
        await expect(page).toHaveURL(/\/auth/);

        // Auth choice → Login
        const loginBtn = page.getByRole('button', { name: /login/i }).first();
        await expect(loginBtn).toBeVisible({ timeout: 3000 });
        await loginBtn.click();
        await expect(page).toHaveURL(/\/login/);

        const phoneInput = page.locator('input[inputmode="numeric"]').first();
        await phoneInput.fill('12345');
        await phoneInput.blur();

        // Send OTP button should be disabled
        const sendOtp = page.getByRole('button', { name: /send otp|get otp|continue/i });
        await expect(sendOtp).toBeDisabled({ timeout: 2000 });
    });

    test('phone input validation: accepts valid 10-digit number', async ({ page }) => {
        await page.goto('/language');
        await page.waitForTimeout(500);
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 3000 });
        await continueBtn.click();
        await expect(page).toHaveURL(/\/auth/);

        // Auth choice → Login
        const loginBtn = page.getByRole('button', { name: /login/i }).first();
        await expect(loginBtn).toBeVisible({ timeout: 3000 });
        await loginBtn.click();
        await expect(page).toHaveURL(/\/login/);

        const phoneInput = page.locator('input[inputmode="numeric"]').first();
        await phoneInput.fill('9876543210');
        await phoneInput.blur();

        const sendOtp = page.getByRole('button', { name: /send otp|get otp|continue/i });
        await expect(sendOtp).toBeEnabled({ timeout: 2000 });
    });

    test('navigates to registration for new user phone', async ({ page }) => {
        // Use a phone that triggers registration (not in the pre-registered list)
        await page.goto('/language');
        await page.waitForTimeout(500);
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 3000 });
        await continueBtn.click();
        await expect(page).toHaveURL(/\/auth/);

        // Auth choice → Login
        const loginBtn = page.getByRole('button', { name: /login/i }).first();
        await expect(loginBtn).toBeVisible({ timeout: 3000 });
        await loginBtn.click();
        await expect(page).toHaveURL(/\/login/);

        const phoneInput = page.locator('input[inputmode="numeric"]').first();
        await phoneInput.fill('9999999999');
        await phoneInput.blur();

        const sendOtp = page.getByRole('button', { name: /send otp|get otp|continue/i });
        await expect(sendOtp).toBeEnabled({ timeout: 2000 });
        await sendOtp.click();

        await expect(page).toHaveURL(/\/otp/, { timeout: 5000 });

        // Fill OTP — UI requires all 6 digits for verify button to enable
        const otpInputs = page.locator('input[inputmode="numeric"]');
        const otpCount = await otpInputs.count();
        if (otpCount >= 6) {
            for (let i = 0; i < 6; i++) {
                await otpInputs.nth(i).fill('1');
            }
        } else {
            await page.keyboard.type('111111');
        }

        // Click Verify & Continue — OTP does not auto-verify
        const verifyBtn = page.getByRole('button', { name: /verify/i });
        await expect(verifyBtn).toBeEnabled({ timeout: 2000 });
        await verifyBtn.click();

        // Should redirect to /register for new users
        await page.waitForURL(/\/register/, { timeout: 10000 });
        // Register page heading — en.json register.welcomeTitle = "Welcome to HindTrucks!"
        await expect(page.getByRole('heading', { name: /welcome to hindtrucks/i })).toBeVisible({ timeout: 5000 });
    });

    test('back button on login returns to language picker', async ({ page }) => {
        await page.goto('/language');
        await page.waitForTimeout(500);
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 3000 });
        await continueBtn.click();
        await expect(page).toHaveURL(/\/auth/);

        // Auth choice → Login
        const loginBtn = page.getByRole('button', { name: /login/i }).first();
        await expect(loginBtn).toBeVisible({ timeout: 3000 });
        await loginBtn.click();
        await expect(page).toHaveURL(/\/login/);

        // Try clicking back navigation
        const topBarBack = page.locator('[data-testid="back"], .back-button, button:has(svg)').first();
        if (await topBarBack.isVisible()) {
            await topBarBack.click();
            await expect(page).toHaveURL(/\/language/);
        }
    });
});