
import { Page, Locator } from '@playwright/test';
import { waitForVisible, waitForVisibleNormalized } from '../helpers/waitForPage';
import { BasketPage } from './basketPage';

export class ConfigureProductPage {
    constructor(private page: Page) { }

    async waitUntilLoaded() {

        await waitForVisibleNormalized(
            this.page.getByRole('heading', { level: 2 }), 'Configure your product');

        await waitForVisible(
            this.page.locator('#mainForm')
        );
    }

    loader(): Locator {
        return this.page.locator('#divLoaderImage');
    }

    warningMessage(): Locator {
        return this.page.locator('#OrderDetails3a_1_accessErrorLabel');
    }

    async addToBasket(): Promise<BasketPage> {
        await this.page.locator('#btnAdd').click();
        return new BasketPage(this.page)
    }

    visibleFieldLabels(): Locator {
        return this.page.locator(
            "#orderForm .field-label:visible:not(.read-only)"
        );
    }

    fieldContainerByLabel(label: string): Locator {
        return this.page
            .locator(`text="${label}"`)
            .first()
            .locator('xpath=ancestor::div[2]');
    }

}
