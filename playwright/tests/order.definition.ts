import { expect } from "playwright/test";
import { RunResult, TestDefinition } from "../types";
import { LoginPage } from "../arena/pages/loginPage";
import { HomePage } from "../arena/pages/homePage";
import { PlaceAnOrderPage } from "../arena/pages/placeAnOrderPage";
import { configureProduct } from "../arena/flows/configureProduct";
import { gotoWithRetry } from "../arena/helpers/navigation";
import { waitForBlockingOverlayToClear } from "../arena/helpers/waitForBlockingOverlay";
import { takeScreenshot } from "../arena/helpers/takeScreenshot";

export const orderCreateTest: TestDefinition = {
    name: "orderCreate",
    site: "arena",
    slow: true,

    async run(page, options, log): Promise<RunResult> {
        try {
            const urlToVisit = options.url || "https://fallback-url";

            const signInLocator = page.getByRole('link', { name: /sign in/i }).first();

            await gotoWithRetry(
                page,
                urlToVisit,
                {
                    waitUntil: 'domcontentloaded',
                    timeout: options.slow ? 180_000 : 60_000,
                },
                signInLocator,
                log
            );

            log?.("Waiting for home page to load...");
            const homePage = new HomePage(page);
            await homePage.waitUntilLoaded()

            log?.("Clicking I Understand cookies button...");
            const cookieClicked = await homePage.acceptCookieBar();
            if (cookieClicked) {
                log?.("Cookie bar accepted.");
            }

            const loginPage = new LoginPage(page);

            log?.("Selecting 'Sign in' button and attempting to log in...");

            const membersPage = await loginPage.signIn(options);

            await expect.soft(page.locator(membersPage.accounts_btn)).toBeVisible({ timeout: 5000 });
            await expect(page.locator(membersPage.breadcrumb)).toBeVisible({ timeout: 5000 });

            log?.("Login successful");

            log?.("Navigating to Place An Order page...");
            await membersPage.clickPlaceAnOrder();

            const placeAnOrderPage = new PlaceAnOrderPage(page);
            await placeAnOrderPage.waitUntilLoaded();

            log?.(options.reference ? `Entering reference: ${options.reference}` : "No reference provided, generating and entering random reference");
            const reference = await placeAnOrderPage.enterReference(options.reference);
            log?.(`REF:${reference}`);

            const result = await placeAnOrderPage.selectProduct(options.productCategory ?? "");

            if (!result.success) {
                log?.(result.message ? `ERROR: Error An unsubmitted blinds order already exists with the reference: ${reference}` : "Unknown error selecting product");
                return {
                    success: false
                };
            }

            log?.("Waiting for product form to load...");
            await waitForBlockingOverlayToClear(page);

            log?.("Product form loaded");

            log?.(`Product selected successfully: ${result.product}`);

            log?.("Configuring product...");

            const basketPage = await configureProduct(
                page,
                options.screenshots,
                options.configureValues,
                true, //add to basket 
                log
            );

            log?.("Product configured and adding to basket");

            log?.("Waiting for Basket Page to load...");

            await waitForBlockingOverlayToClear(page);

            await basketPage.waitUntilLoaded();

            log?.("Basket Page loaded");

            if (options.screenshots?.basket) {
                const basketScreenshotPath = await takeScreenshot(
                    page,
                    'basket',
                    log
                );

                log?.(`Basket screenshot saved: ${basketScreenshotPath}`);
            }

            if (options.saveOrder && !options.returnIdoc) {

                const unsubmittedOrderPage = await basketPage.saveAndExit(reference);

                log?.("Waiting for Unsubmitted Orders Page to load...");

                await unsubmittedOrderPage.waitUntilLoaded();

                log?.("Unsubmitted Orders Page loaded");

                if (options.screenshots?.unsubmittedOrders) {
                    const unsubmittedOrdersPageScreenshotPath = await takeScreenshot(
                        page,
                        'unsubmitted-orders',
                        log
                    );

                    log?.(`Unsubmitted Orders Page screenshot saved: ${unsubmittedOrdersPageScreenshotPath}`);
                }

                return {
                    success: true
                };
            }

            log?.("Selecting continue...");
            const addressPage = await basketPage.continue();

            log?.("Waiting for Address Page to load...");

            await waitForBlockingOverlayToClear(page);

            await addressPage.waitUntilLoaded();

            log?.("Address Page loaded");

            log?.("Selecting predefined delivery address...");

            const selectedAddress = await addressPage.selectAddress();

            log?.(`Selected predefined delivery address: ${selectedAddress}`);

            const deliveryOptionsCount = await addressPage.getDeliveryOptionCount();

            console.debug(`has delivery count: ${deliveryOptionsCount} - 
                for now bypassing selection as its a radio selection so first is selected, will be extended in future`)

            log?.("Selecting continue...");

            const confirmYouOrderPage = await addressPage.continue();

            await waitForBlockingOverlayToClear(page);

            await confirmYouOrderPage.waitUntilLoaded();

            log?.("Confirm Your Order Page loaded");

            if (options.saveOrder && options.returnIdoc) {

                log?.("Selecting return Idoc...");

                const idoc = await confirmYouOrderPage.returnIdoc();

                log?.("Return Idoc completed");
                log?.(idoc);

                const unsubmittedOrderPage = await basketPage.saveAndExit(reference);

                log?.("Waiting for Unsubmitted Orders Page to load...");

                await unsubmittedOrderPage.waitUntilLoaded();

                log?.("Unsubmitted Orders Page loaded");

                if (options.screenshots?.unsubmittedOrders) {
                    const unsubmittedOrdersPageScreenshotPath = await takeScreenshot(
                        page,
                        'unsubmitted-orders',
                        log
                    );

                    log?.(`Unsubmitted Orders Page screenshot saved: ${unsubmittedOrdersPageScreenshotPath}`);
                }

                return {
                    success: true
                };
            }

            if (options.returnIdoc) {

                log?.("Selecting return Idoc...");

                const idoc = await confirmYouOrderPage.returnIdoc();

                log?.("Return Idoc completed");
                log?.(idoc);
            }

            log?.("Selecting submit order...");

            const orderSumamryPage = await confirmYouOrderPage.submitOrder();

            log?.("Waiting for Order Summary Page...");

            await waitForBlockingOverlayToClear(page, { disappearTimeout: 50_000 });

            await orderSumamryPage.waitUntilLoaded()

            log?.("Order Sumamry Page loaded");

            if (options.screenshots?.confirmation) {
                const summaryScreenshotPath = await takeScreenshot(
                    page,
                    'order-summary',
                    log
                );

                log?.(`Order summary screenshot saved: ${summaryScreenshotPath}`);
            }

            return { success: true };
        }
        catch (err) {

            let message: string | undefined;

            if (page) {
                const screenshotPath = await takeScreenshot(
                    page,
                    'order-failed',
                    log
                );

                message = `, please see screenshot for details: ${screenshotPath}`;
            }

            log?.(`ERROR: Order creation failed with error: ${(err as Error).message}${message || ''}`);

            return {
                success: false,
                error: message
            };

        }
    }
}