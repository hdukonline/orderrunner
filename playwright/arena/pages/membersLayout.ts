import { Page } from '@playwright/test';
import { MembersSideNav } from './components/memberSideNav';

export class MembersLayout {
    readonly sideNav: MembersSideNav;

    public readonly accounts_btn =
        "//*[not(@class='l-header__mobile-nav') and @class='l-header__contact']/*/*[text()='Account']";

    public readonly breadcrumb =
        "//*[@class='c-breadcrumb u-clearfix']";


    constructor(protected page: Page) {
        this.sideNav = new MembersSideNav(page);
    }

    async clickPlaceAnOrder() {
        await this.sideNav.goToPlaceAnOrder();
    }

}
