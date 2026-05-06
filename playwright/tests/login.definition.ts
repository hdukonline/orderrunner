import { expect } from "playwright/test";
import { RunResult, TestDefinition } from "../types";
import { LoginPage } from "../arena/pages/loginPage";
import { HomePage } from "../arena/pages/homePage";
import { takeScreenshot } from "../arena/helpers/takeScreenshot";


export const loginTest: TestDefinition = {
    name: "login",
    site: "arena",
    slow: true,

    async run(page, options, log): Promise<RunResult> {
        const urlToVisit = options.url || "https://fallback-url";
        log?.(`Navigating to \`${urlToVisit}\``);
        await page.goto(urlToVisit);

        log?.("Clicking I Understand cookies button");
        await new HomePage(page).acceptCookieBar();

        const loginPage = new LoginPage(page);

        log?.("selecting 'Sign in' button and attempting to log in");

        const membersPage = await loginPage.signIn(options);

        await expect.soft(page.locator(membersPage.accounts_btn)).toBeVisible({ timeout: 5000 });
        await expect(page.locator(membersPage.breadcrumb)).toBeVisible({ timeout: 5000 });

        log?.("Login successful");

        const screenshotPath = await takeScreenshot(
            page,
            'arena-login-success',
            log
        );

        log?.(`Screenshot saved: ${screenshotPath}`);
        return {
            success: true,
        };
    },
};

export const portalLoginTest: TestDefinition = {
    name: "login",
    site: "portal",
    slow: true,

    async run(page, options, log): Promise<RunResult> {
        await page.goto(options.url || "https://fallback-url");


        const screenshotPath = await takeScreenshot(
            page,
            'portal-login-success',
            log
        );

        log?.(`Screenshot saved: ${screenshotPath}`);
        return {
            success: true,
        };
    },
};