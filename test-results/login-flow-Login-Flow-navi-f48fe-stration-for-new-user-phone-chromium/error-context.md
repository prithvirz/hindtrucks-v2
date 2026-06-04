# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login-flow.spec.ts >> Login Flow >> navigates to registration for new user phone
- Location: e2e\login-flow.spec.ts:95:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/create account/i)
Expected: visible
Error: strict mode violation: getByText(/create account/i) resolved to 2 elements:
    1) <h1 class="text-[17px] font-extrabold text-ink truncate flex-1">Create Account</h1> aka getByRole('heading', { name: 'Create Account' })
    2) <button disabled class="inline-flex items-center justify-center gap-2 font-bold tracking-tight rounded-xl boxed-btn-active transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none select-none bg-accent text-white shadow-accent hover:bg-accent-press active:shadow-card h-14 px-6 text-[16px] w-full ">Create Account</button> aka getByRole('button', { name: 'Create Account' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/create account/i)

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6] [cursor=pointer]:
    - img [ref=e8]
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: 💬 Message
        - generic [ref=e13]: now
      - paragraph [ref=e14]: HindTrucks Verification
      - paragraph [ref=e15]: Your verification code (OTP) is 4821. Valid for 10 minutes. Do not share.
  - generic [ref=e16]:
    - banner [ref=e17]:
      - heading "Create Account" [level=1] [ref=e19]
    - generic [ref=e20]:
      - generic [ref=e21]:
        - heading "Welcome to HindTrucks!" [level=2] [ref=e22]
        - paragraph [ref=e23]: Complete your profile for phone number 9999999999 to start receiving loads.
      - generic [ref=e24]:
        - generic [ref=e25]: Select Your Role
        - generic [ref=e26]:
          - button "Driver I drive my own vehicle or work for a fleet." [ref=e27] [cursor=pointer]:
            - generic [ref=e28]:
              - img [ref=e30]
              - img [ref=e34]
            - generic [ref=e36]:
              - paragraph [ref=e37]: Driver
              - paragraph [ref=e38]: I drive my own vehicle or work for a fleet.
          - button "Fleet Owner I own a fleet and manage multiple trucks/drivers." [ref=e39] [cursor=pointer]:
            - img [ref=e42]
            - generic [ref=e46]:
              - paragraph [ref=e47]: Fleet Owner
              - paragraph [ref=e48]: I own a fleet and manage multiple trucks/drivers.
      - generic [ref=e49]:
        - generic [ref=e50]:
          - generic [ref=e51]: Full Name
          - generic [ref=e52]:
            - img [ref=e53]
            - textbox "e.g. Gurpreet Singh" [ref=e56]
        - generic [ref=e57]:
          - generic [ref=e58]: Driving License Number
          - generic [ref=e59]:
            - img [ref=e60]
            - textbox "e.g. DL-14201234567" [ref=e63]
      - generic [ref=e64]:
        - heading "Your Truck Details" [level=3] [ref=e65]:
          - img [ref=e66]
          - text: Your Truck Details
        - generic [ref=e71]:
          - generic [ref=e72]: Truck Registration Number
          - generic [ref=e73]:
            - generic [ref=e74]: IND
            - textbox "e.g. PB10 AB 4521" [ref=e75]
        - generic [ref=e76]:
          - generic [ref=e77]:
            - generic [ref=e78]: Truck Type
            - combobox [ref=e79] [cursor=pointer]:
              - option "19 ft Container" [selected]
              - option "32 ft Container"
              - option "Open Truck (14 Wheeler)"
              - option "Dumper Truck"
              - option "Trailer LPT"
          - generic [ref=e80]:
            - generic [ref=e81]: Max Capacity
            - textbox "e.g. 9 Ton" [ref=e82]: 9 Ton
      - generic [ref=e83]:
        - img [ref=e84]
        - generic [ref=e87]: I agree to HindTrucks transport agreement and terms of service.
    - generic [ref=e88]:
      - button "Create Account" [disabled]
```

# Test source

```ts
  32  |         await sendOtp.click();
  33  | 
  34  |         // 5. OTP screen
  35  |         await expect(page).toHaveURL(/\/otp/, { timeout: 5000 });
  36  |         // OTP inputs: 4 <input inputMode="numeric"> elements
  37  |         const otpInputs = page.locator('input[inputmode="numeric"]');
  38  |         const otpCount = await otpInputs.count();
  39  |         // Fill each OTP digit
  40  |         if (otpCount >= 4) {
  41  |             for (let i = 0; i < 4; i++) {
  42  |                 await otpInputs.nth(i).fill('1');
  43  |             }
  44  |         } else {
  45  |             // Fallback: find all inputs on the page
  46  |             const inputs = page.locator('input');
  47  |             const inputCount = await inputs.count();
  48  |             // Type into the OTP area
  49  |             await page.keyboard.type('1111');
  50  |         }
  51  | 
  52  |         // 6. Click Verify & Continue — OTP does not auto-verify
  53  |         const verifyBtn = page.getByRole('button', { name: /verify/i });
  54  |         await expect(verifyBtn).toBeEnabled({ timeout: 2000 });
  55  |         await verifyBtn.click();
  56  | 
  57  |         // 7. Should navigate to home after OTP verify
  58  |         await page.waitForURL(/\/home/, { timeout: 10000 });
  59  |         await expect(page.locator('#driver-profile, [data-testid="driver-profile"]')).toBeVisible({ timeout: 5000 });
  60  |     });
  61  | 
  62  |     test('phone input validation: rejects short numbers', async ({ page }) => {
  63  |         await page.goto('/language');
  64  |         await page.waitForTimeout(500);
  65  |         const continueBtn = page.getByRole('button', { name: /continue/i });
  66  |         await expect(continueBtn).toBeVisible({ timeout: 3000 });
  67  |         await continueBtn.click();
  68  |         await expect(page).toHaveURL(/\/login/);
  69  | 
  70  |         const phoneInput = page.locator('input[inputmode="numeric"]').first();
  71  |         await phoneInput.fill('12345');
  72  |         await phoneInput.blur();
  73  | 
  74  |         // Send OTP button should be disabled
  75  |         const sendOtp = page.getByRole('button', { name: /send otp|get otp|continue/i });
  76  |         await expect(sendOtp).toBeDisabled({ timeout: 2000 });
  77  |     });
  78  | 
  79  |     test('phone input validation: accepts valid 10-digit number', async ({ page }) => {
  80  |         await page.goto('/language');
  81  |         await page.waitForTimeout(500);
  82  |         const continueBtn = page.getByRole('button', { name: /continue/i });
  83  |         await expect(continueBtn).toBeVisible({ timeout: 3000 });
  84  |         await continueBtn.click();
  85  |         await expect(page).toHaveURL(/\/login/);
  86  | 
  87  |         const phoneInput = page.locator('input[inputmode="numeric"]').first();
  88  |         await phoneInput.fill('9876543210');
  89  |         await phoneInput.blur();
  90  | 
  91  |         const sendOtp = page.getByRole('button', { name: /send otp|get otp|continue/i });
  92  |         await expect(sendOtp).toBeEnabled({ timeout: 2000 });
  93  |     });
  94  | 
  95  |     test('navigates to registration for new user phone', async ({ page }) => {
  96  |         // Use a phone that triggers registration (not in the pre-registered list)
  97  |         await page.goto('/language');
  98  |         await page.waitForTimeout(500);
  99  |         const continueBtn = page.getByRole('button', { name: /continue/i });
  100 |         await expect(continueBtn).toBeVisible({ timeout: 3000 });
  101 |         await continueBtn.click();
  102 |         await expect(page).toHaveURL(/\/login/);
  103 | 
  104 |         const phoneInput = page.locator('input[inputmode="numeric"]').first();
  105 |         await phoneInput.fill('9999999999');
  106 |         await phoneInput.blur();
  107 | 
  108 |         const sendOtp = page.getByRole('button', { name: /send otp|get otp|continue/i });
  109 |         await expect(sendOtp).toBeEnabled({ timeout: 2000 });
  110 |         await sendOtp.click();
  111 | 
  112 |         await expect(page).toHaveURL(/\/otp/, { timeout: 5000 });
  113 | 
  114 |         // Fill OTP
  115 |         const otpInputs = page.locator('input[inputmode="numeric"]');
  116 |         const otpCount = await otpInputs.count();
  117 |         if (otpCount >= 4) {
  118 |             for (let i = 0; i < 4; i++) {
  119 |                 await otpInputs.nth(i).fill('1');
  120 |             }
  121 |         } else {
  122 |             await page.keyboard.type('1111');
  123 |         }
  124 | 
  125 |         // Click Verify & Continue — OTP does not auto-verify
  126 |         const verifyBtn = page.getByRole('button', { name: /verify/i });
  127 |         await expect(verifyBtn).toBeEnabled({ timeout: 2000 });
  128 |         await verifyBtn.click();
  129 | 
  130 |         // Should redirect to /register for new users
  131 |         await page.waitForURL(/\/register/, { timeout: 10000 });
> 132 |         await expect(page.getByText(/create account/i)).toBeVisible({ timeout: 5000 });
      |                                                         ^ Error: expect(locator).toBeVisible() failed
  133 |     });
  134 | 
  135 |     test('back button on login returns to language picker', async ({ page }) => {
  136 |         await page.goto('/language');
  137 |         await page.waitForTimeout(500);
  138 |         const continueBtn = page.getByRole('button', { name: /continue/i });
  139 |         await expect(continueBtn).toBeVisible({ timeout: 3000 });
  140 |         await continueBtn.click();
  141 |         await expect(page).toHaveURL(/\/login/);
  142 | 
  143 |         // Find back button/arrow
  144 |         const backBtn = page.locator('button, a').filter({ hasText: '' }).first();
  145 |         // Try clicking back navigation
  146 |         const topBarBack = page.locator('[data-testid="back"], .back-button, button:has(svg)').first();
  147 |         if (await topBarBack.isVisible()) {
  148 |             await topBarBack.click();
  149 |             await expect(page).toHaveURL(/\/language/);
  150 |         }
  151 |     });
  152 | });
```