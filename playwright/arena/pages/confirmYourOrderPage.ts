import { Page } from "playwright-core";
import { waitForVisible, waitForVisibleNormalized } from "../helpers/waitForPage";
import { OrderSummaryPage } from "./orderSummaryPage";
import { UnsubmittedOrdersPage } from "./unsubmittedOrdersPage";
import { waitForBlockingOverlayToClear } from "../helpers/waitForBlockingOverlay";

export class ConfirmYourOrderPage {
    constructor(private page: Page) { }

    async waitUntilLoaded() {
        await waitForVisibleNormalized(
            this.page.getByRole('heading', { level: 2 }),
            'Confirm your order'
        );

        await waitForVisible(
            this.page.locator('#lnkSubmitTop')
        );
    }

    async saveAndExit(reference: string): Promise<UnsubmittedOrdersPage> {
        await this.page.locator('#lnkSaveExitTop').click();

        await this.page.waitForLoadState('domcontentloaded');

        const unsubmittedPage = new UnsubmittedOrdersPage(this.page, reference);
        await unsubmittedPage.waitUntilLoaded();

        return unsubmittedPage;
    }

    async submitOrder(): Promise<OrderSummaryPage> {
        await this.page.locator('#lnkSubmitTop').click();

        await this.page.waitForLoadState('domcontentloaded');

        const summaryPage = new OrderSummaryPage(this.page);
        await summaryPage.waitUntilLoaded();

        return summaryPage;
    }

    async returnIdoc(): Promise<string> {
        const returnIdocBtn = this.page.locator('#lnkReturnIdoc');

        if (!(await returnIdocBtn.isVisible().catch(() => false))) {
            return "Return IDOC button not available for this user.";
        }

        await returnIdocBtn.click();
        await waitForBlockingOverlayToClear(this.page);

        const idocContainer = this.page.locator('#litIdoc');
        await waitForVisible(idocContainer);

        const textarea = idocContainer.locator('textarea');
        await waitForVisible(textarea);

        const idocText = await textarea.inputValue();

        return `IDOC:${idocText}`;
    }
}