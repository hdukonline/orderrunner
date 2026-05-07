import { Page } from "playwright-core";
import { MembersPage } from "./membersPage";
import { expect } from "playwright/test";

export class LoginPage {
    public readonly username_input = '#loginModel_Username';
    public readonly password_input = '#loginModel_Password';
    public readonly submit_btn = "//*[@value='Submit']";

    constructor(private page: Page) { }

    async signIn(options: { username?: string; password?: string }): Promise<MembersPage> {
        await this.page.locator('div.l-header__login a.c-button', { hasText: 'Sign in' }).first().click();
        await this.page.fill(this.username_input, options.username || "default-username");
        await this.page.fill(this.password_input, options.password || "default-password");

        const submitButton = this.page.locator(this.submit_btn);
        await expect(submitButton).toBeVisible({ timeout: 5000 });
        await submitButton.click();
        await expect.soft(submitButton).toBeHidden({ timeout: 5000 });

        return new MembersPage(this.page);
    }

}


