import { Page } from "playwright";
import { waitForVisible, waitForVisibleNormalized } from "../helpers/waitForPage";

export class UnsubmittedOrdersPage {
    constructor(
        private page: Page,
        private reference: string
    ) { }

    async waitUntilLoaded() {
        await waitForVisibleNormalized(
            this.page.getByRole('heading', { level: 2 }), 'Unsubmitted Orders');

        await waitForVisible(
            this.page.locator('table.table-order-history')
        );

        await waitForVisible(
            this.page.locator('td.-col-ref', {
                hasText: this.reference
            })
        );
    }
}