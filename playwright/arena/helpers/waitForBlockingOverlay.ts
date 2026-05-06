
import { Page } from 'playwright';

export async function waitForBlockingOverlayToClear(
    page: Page,
    options?: {
        appearTimeout?: number;
        disappearTimeout?: number;
    }
) {
    const {
        appearTimeout = 2000,
        disappearTimeout = 30_000,
    } = options ?? {};

    const overlay = page.locator('.blockUI.blockPage');

    try {
        await overlay.waitFor({ state: 'visible', timeout: appearTimeout });

        await overlay.waitFor({ state: 'hidden', timeout: disappearTimeout });
    } catch {
        // Overlay never appeared — that's fine.. maybe..
    }
}