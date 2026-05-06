import { Locator, Page } from "playwright";
import { assertPageReady } from "./assertPageReady";

export async function gotoWithRetry(
    page: Page,
    url: string,
    options: {
        waitUntil: 'domcontentloaded';
        timeout: number;
    },
    readyLocator: Locator,
    log?: (msg: string) => void
) {
    try {
        log?.(`Navigating to ${url}`);
        await page.goto(url, options);

        await assertPageReady(readyLocator);
    } catch (err) {
        log?.('Navigation or readiness check failed. Retrying once…');

        await page.waitForTimeout(2000);
        await page.goto(url, options);
        await assertPageReady(readyLocator);
    }
}
``