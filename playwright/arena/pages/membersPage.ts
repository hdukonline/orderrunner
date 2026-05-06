import { Page } from "playwright";
import { MembersLayout } from "./membersLayout";

export class MembersPage extends MembersLayout {

    constructor(page: Page) {
        super(page);
    }
}