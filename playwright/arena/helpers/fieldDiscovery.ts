import { ConfigureProductPage } from '../pages/configureProductPage';
import {
    IGNORED_FIELD_IDS,
    IGNORED_FIELD_NAMES,
    IGNORED_LABEL_TEXT,
} from './ignoredFields';

export async function getVisibleFields(
    page: ConfigureProductPage
): Promise<string[]> {
    await page.loader().waitFor({ state: 'hidden' });

    const labelLocators = await page.visibleFieldLabels().all();
    const result: string[] = [];

    for (const label of labelLocators) {
        // Skip hidden ancestors
        if (!(await label.isVisible())) continue;

        const id = await label.getAttribute('id');
        const name = await label.getAttribute('name');
        const text = (await label.innerText())?.replace('*', '').trim();

        if (!text) continue;

        // Ignore by ID
        if (id && IGNORED_FIELD_IDS.has(id)) continue;

        // Ignore by name
        if (name && IGNORED_FIELD_NAMES.has(name)) continue;

        // Ignore by label text
        if (IGNORED_LABEL_TEXT.has(text)) continue;

        // Ignore read-only labels
        const classAttr = await label.getAttribute('class');
        if (classAttr?.includes('read-only')) continue;

        // console.debug('[FIELD INCLUDED]', {
        //     text,
        //     id,
        //     name,
        // });

        result.push(text);
    }

    return result;
}