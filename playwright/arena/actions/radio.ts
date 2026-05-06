import { Page } from '@playwright/test';
import { captureUnitIfApplicable } from '../helpers/captureUnits';

export async function handleRadio(
    page: Page,
    containerId: string,
    option?: ConfigureValue
): Promise<string | undefined> {
    const container = page.locator(`#${containerId}`);
    const radios = container.locator('input[type="radio"]');
    const count = await radios.count();

    if (count === 0) {
        throw new Error(`[RADIO] No radios found in container ${containerId}`);
    }

    // Helper: select one radio safely
    const selectRadio = async (inputIndex: number) => {
        const input = radios.nth(inputIndex);
        const label = input.locator('xpath=following-sibling::label[1]');

        try {
            // Normal radios
            await input.check();
        } catch {
            // Styled / hidden radios (AWN/INTU)
            await label.click({ force: true });
        }
    };

    // ---- explicit value ----
    if (option) {
        for (let i = 0; i < count; i++) {
            const radioInput = radios.nth(i);

            if (option.by === 'value') {
                const radioValue = await radioInput.getAttribute('value');

                if (radioValue === option.value) {
                    await selectRadio(i);
                    await captureUnitIfApplicable(page, containerId);
                    return option.value;
                }
            }

            if (option.by === 'label') {
                const label = radioInput.locator(
                    'xpath=following-sibling::label[1]'
                );

                const labelText = (await label.textContent())?.trim();

                if (labelText === option.value) {
                    await selectRadio(i);
                    await captureUnitIfApplicable(page, containerId);
                    return option.value;
                }
            }

        }

        throw new Error(
            `[RADIO] Value "${option.value}" not found in container ${containerId}`
        );
    }

    // ---- random selection ----
    const randomIndex = Math.floor(Math.random() * count);
    console.debug(`[RADIO] randomly selecting option index: ${randomIndex}`);

    const radio = radios.nth(randomIndex);
    await selectRadio(randomIndex);
    await captureUnitIfApplicable(page, containerId);

    const radioValue = await radio.getAttribute('value');
    return radioValue ?? undefined;

}
