import { Page } from 'playwright';

export class MembersSideNav {
    constructor(private page: Page) { }

    async goToPlaceAnOrder() {
        await this.page.locator('nav.js-sticky a', { hasText: 'Place An Order' }).click();
    }
}