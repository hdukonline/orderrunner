import { Locator } from "playwright";

export async function waitForVisible(
    locator: Locator,
    timeout = 5000
) {
    await locator.waitFor({ state: 'visible', timeout });
}

function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();
}

export async function waitForVisibleNormalized(
    locator: Locator,
    expectedText: string,
    timeout = 5000
) {
    await waitForVisible(locator, timeout);

    const actualText = await locator.textContent();

    if (!actualText) {
        throw new Error("Element is visible but contains no text");
    }

    const actual = normalize(actualText);
    const expected = normalize(expectedText);

    if (!actual.includes(expected)) {
        throw new Error(
            `Text mismatch after normalization.\n` +
            `Expected (normalized): "${expected}"\n` +
            `Actual (normalized):   "${actual}"`
        );
    }
}

