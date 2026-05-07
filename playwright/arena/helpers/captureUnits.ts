import { Page } from "playwright-core";
import { sqmState } from "../actions/sqmState";

export async function captureUnitIfApplicable(
    page: Page,
    locatorId: string
) {
    if (!locatorId.toLowerCase().includes('unit')) return;

    console.debug(`[SQM] Checking for unit selection on locator: ${locatorId}`);

    const checked = page.locator(
        `xpath=//*[@id="${locatorId}" and @checked]`
    );

    if (await checked.count() === 0) return;

    const labelText = checked
        .locator('xpath=following-sibling::label')
        .first();

    console.debug(
        `[SQM] Found unit label for locator ${locatorId}, capturing text...`
    );

    const text = await labelText.textContent();
    if (!text) return;

    sqmState.unit = text.toLowerCase().includes('inch')
        ? 'inches'
        : 'cm';

    console.debug('[SQM] Units captured:', sqmState.unit);
}