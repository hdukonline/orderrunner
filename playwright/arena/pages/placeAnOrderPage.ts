import { Page } from 'playwright';
import { GenerateRandomReference } from '../helpers/generateRandomReference';
import { waitForVisible } from '../helpers/waitForPage';

type ProductResolution = {
    label: string;
    subProduct?: string;
};

export class PlaceAnOrderPage {
    constructor(private page: Page) { }

    async waitUntilLoaded() {
        await this.page.waitForLoadState('networkidle');

        await waitForVisible(
            this.page.locator('section.c-place-an-order')
        );

        await waitForVisible(
            this.page.locator('#refNoInput')
        );
    }

    async enterReference(reference?: string, length?: number): Promise<string> {
        if (!reference || !reference.trim()) {
            reference = await new GenerateRandomReference(this.page, length)
                .getOrGenerateReference();
        }

        const input = this.page.locator('#refNoInput');

        await input.waitFor({ state: 'visible' });

        await this.page.waitForFunction(
            el => {
                const input = el as HTMLInputElement;
                return !input.disabled && !input.readOnly;
            },
            await input.elementHandle()
        );

        await input.click();
        await input.fill(reference);

        await this.page.waitForTimeout(200);

        const finalValue = await input.inputValue();

        if (finalValue !== reference) {
            throw new Error(
                `Reference was reset after entry (expected "${reference}", got "${finalValue}")`
            );
        }

        return reference;
    }

    async selectProduct(productCategory: string) {
        const product = this.resolveProduct(productCategory);

        await this.page
            .locator(`input[type="submit"][value="${product.label}"]`)
            .click();

        const errorMessage = this.page.locator('#error-message');
        const errorText =
            'An unsubmitted blinds order already exists with the reference';

        try {
            await this.page.waitForFunction(
                (text) => {
                    const el = document.querySelector('#error-message');
                    return el?.textContent?.includes(text);
                },
                errorText,
                { timeout: 1200 }
            );

            const text = await errorMessage.textContent();
            return {
                success: false,
                message: text?.trim() || 'Order already exists',
            };
        } catch {
            // Timeout OR navigation happened first = success
        }

        if (product.subProduct) {
            await this.selectSubProduct(product.subProduct);
        }

        return { success: true, product: product.label };
    }

    private async selectSubProduct(productCode: string) {

        const link = this.page.locator(
            `a[href*="product=${productCode}"]`
        );

        await waitForVisible(
            this.page.locator('section.c-place-an-order--choose')
        );

        await waitForVisible(link);

        await link.first().click();

    }

    CATEGORY_TO_CHOOSER: Record<string, string> = {
        rollers: 'ROB',
        pleated: 'PLT',
        romans: 'ROM',
        venetians: 'VEN',
        verticals: 'VET',
        curtains: 'CRT',
    };

    private resolveProduct(category: string): ProductResolution {
        if (category === 'outdoor') {
            return { label: 'Outdoor Products' };
        }

        if (category === 'shutters') {
            return { label: 'Perfect Fit Shutters' };
        }

        return {
            label: 'Blinds & Curtains',
            subProduct: this.CATEGORY_TO_CHOOSER[category],
        };
    }
}