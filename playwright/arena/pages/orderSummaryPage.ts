import { Page } from "playwright-core";
import { waitForVisibleNormalized } from "../helpers/waitForPage";

export class OrderSummaryPage {
    async waitUntilLoaded() {
        await waitForVisibleNormalized(
            this.page.getByRole('heading', { level: 2 }), 'Order Summary');
    }

    constructor(private page: Page) {

    }
}