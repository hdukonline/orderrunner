import { Page } from '@playwright/test';

export type ConfigError = {
    message: string;
    fields: string[];
};

export async function checkForConfigError(
    page: Page,
    timeout = 1500
): Promise<ConfigError | null> {
    const error = page.locator('#ErrorNotification');

    try {
        await error.waitFor({ state: 'visible', timeout });

        const raw = (await error.textContent())?.trim();
        if (!raw) {
            return {
                message: 'Configuration error detected',
                fields: [],
            };
        }

        const prefix =
            'There are some errors with your product configuration, please correct all highlighted areas and try again.';

        const tail = raw.startsWith(prefix)
            ? raw.slice(prefix.length)
            : raw;

        const fields = tail
            .split('*')
            .map(f => f.trim())
            .filter(Boolean);

        return {
            message: raw,
            fields,
        };
    } catch {
        return null;
    }
}