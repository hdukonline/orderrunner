import { Page } from "playwright-core";
import { waitForVisible, waitForVisibleNormalized } from "../helpers/waitForPage";
import { ChooseYourAddressPage } from "./chooseYourAddressPage";
import { UnsubmittedOrdersPage } from "./unsubmittedOrdersPage";

export class BasketPage {

    constructor(private page: Page) { }

    async waitUntilLoaded() {

        await waitForVisibleNormalized(
            this.page.getByRole('heading', { level: 2 }), 'View Your Basket');

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

    async continue(): Promise<ChooseYourAddressPage> {
        await this.page.locator('#lnkSubmitTop').click();

        await this.page.waitForLoadState('domcontentloaded');

        const addressPage = new ChooseYourAddressPage(this.page);
        await addressPage.waitUntilLoaded();

        return addressPage;
    }

}