
import { Page } from "playwright";
import { waitForVisible, waitForVisibleNormalized } from "../helpers/waitForPage";
import { ConfirmYourOrderPage } from "./confirmYourOrderPage";


export class ChooseYourAddressPage {
    constructor(private page: Page) { }

    async waitUntilLoaded() {

        await waitForVisibleNormalized(
            this.page.getByRole('heading', { level: 2 }), 'Choose Your Address');

        await waitForVisible(
            this.page.locator('#addressOptionDropDown')
        );
    }

    async selectAddress(): Promise<string> {
        const dropdown = this.page.locator('#addressOptionDropDown');
        const options = dropdown.locator('option');

        const optionCount = await options.count();

        let storedValue: string | null = null;

        for (let i = 0; i < optionCount; i++) {
            const value = await options.nth(i).getAttribute('value');

            if (value && value !== 'NONE' && value !== 'custom') {
                storedValue = value;
                break;
            }
        }

        if (!storedValue) {
            throw new Error(
                'No predefined delivery addresses available. ' +
                'Alternate address selection is not yet supported.'
            );
        }

        await dropdown.selectOption(storedValue);

        await waitForVisible(
            this.page.locator('#DeliveryOptions .delivery-options')
        );

        return storedValue;
    }


    async getDeliveryOptionCount(): Promise<number> {
        const options = this.page.locator(
            '#OrderDeliveryOptionsV3_1_deliveryOptionList input[type="radio"]'
        );

        const count = await options.count();

        if (count === 0) {
            throw new Error(
                'No delivery options were returned for the selected address.'
            );
        }

        // Future work: select specific delivery option
        return count;
    }

    async continue(): Promise<ConfirmYourOrderPage> {
        await this.page.locator('#lnkContinue').click();

        await this.page.waitForLoadState('domcontentloaded');

        const confirmPage = new ConfirmYourOrderPage(this.page);
        await confirmPage.waitUntilLoaded();

        return confirmPage;
    }
}
