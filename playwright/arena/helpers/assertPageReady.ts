
import { Locator } from 'playwright';

export async function assertPageReady(
    locator: Locator,
    timeout = 5000
) {
    await locator.waitFor({ state: 'visible', timeout });
}
