import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'e2e-results.json' }],
    ],
    webServer: {
        command: 'npx vite --port 5174',
        url: 'http://localhost:5174',
        reuseExistingServer: true,
        timeout: 30_000,
    },
    use: {
        baseURL: 'http://localhost:5174',
        viewport: { width: 390, height: 844 },
        actionTimeout: 10_000,
        navigationTimeout: 15_000,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        video: 'off',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                viewport: { width: 390, height: 844 },
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                isMobile: true,
                hasTouch: true,
                deviceScaleFactor: 3,
            },
        },
    ],
    timeout: 30_000,
    expect: {
        timeout: 8_000,
    },
});