import { Page } from 'playwright';
import fs from 'fs';
import path from 'path';

export async function takeScreenshot(
    page: Page | undefined,
    name: string,
    log?: (msg: string) => void
): Promise<string | undefined> {
    if (!page || page.isClosed()) {
        log?.('Skipping screenshot: page is already closed');
        return undefined;
    }

    try {
        const dir = path.resolve('screenshots');
        fs.mkdirSync(dir, { recursive: true });

        const filePath = path.join(
            dir,
            `${name}-${Date.now()}.png`
        );

        await page.screenshot({
            path: filePath,
            fullPage: true,
        });

        return filePath;
    } catch (err) {
        log?.(
            `Failed to take screenshot: ${(err as Error).message}`
        );
        return undefined;
    }
}