import { Locator } from '@playwright/test';

export async function handleDropdown(
    select: Locator,
    option?: ConfigureValue
): Promise<string | undefined> {
    const page = select.page();
    const scopedSelect = select.filter({ visible: true }).first();

    if (!(await scopedSelect.count())) {
        throw new Error('[DROPDOWN] No visible select found for field');
    }

    // ---- explicit value ----
    if (option) {
        if (option.by === 'label') {
            await scopedSelect.selectOption({ label: option.value });
        } else {
            await scopedSelect.selectOption({ value: option.value });
        }

        await page.click('body');
        return option.value;
    }

    // ---- random selection ----
    const options = await scopedSelect
        .locator('option:not(:disabled):not([value="NONE"])')
        .all();

    if (options.length === 0) {
        console.debug('[DROPDOWN] No selectable options after loading');
        return;
    }

    const randomOption =
        options[Math.floor(Math.random() * options.length)];

    const valueToSelect = await randomOption.getAttribute('value');
    if (!valueToSelect) return;

    await scopedSelect.selectOption(valueToSelect);
    await page.click('body');

    return valueToSelect;
}