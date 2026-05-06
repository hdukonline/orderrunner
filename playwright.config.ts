import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 120_000,
    retries: 0,
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        actionTimeout: 30_000,
        ignoreHTTPSErrors: true
    }
});
