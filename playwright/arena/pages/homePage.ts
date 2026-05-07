import { Page } from "playwright-core";
import { waitForVisible } from "../helpers/waitForPage";

export class HomePage {
    private readonly cookieBar = '#cookie-bar';
    private readonly iUnderstandBtn = ".cb-enable";

    constructor(private page: Page) { }

    async waitUntilLoaded() {
        await waitForVisible(
            this.page.getByRole('link', { name: /sign in/i }).first()
        );

        await waitForVisible(
            this.page.getByRole('link', { name: /register/i }).first()
        );

    }

    /**
    * Accepts the cookie bar if it exists
    */
    async acceptCookieBar(): Promise<boolean> {
        const cookieBar = this.page.locator(this.cookieBar);
        const acceptBtn = cookieBar.locator(this.iUnderstandBtn);

        try {
            await cookieBar.waitFor({ state: 'visible', timeout: 6000 });

            // Wait for the button itself to be clickable
            await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
            await acceptBtn.click();
        } catch {
            return false;
        }

        return true;
    }

}


