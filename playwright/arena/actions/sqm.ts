import { Page } from '@playwright/test';

export async function checkForSqmError(page: Page): Promise<string | null> {
    const error = page.locator('#ErrorNotification');

    if (!(await error.isVisible())) return null;

    const text = (await error.textContent()) ?? '';

    if (text.includes('Max square meterage is')) {
        return text;
    }

    return null;
}

export function deriveMaxSqmValue(message: string, unit: 'cm' | 'inches') {
    if (message.includes('5 sqm')) {
        return unit === 'cm' ? 50000 : 7750;
    }

    if (message.includes('2.5 sqm')) {
        return unit === 'cm' ? 25000 : undefined;
    }

    if (message.includes('2 sqm')) {
        return unit === 'cm' ? 20000 : undefined;
    }

    return undefined;
}
