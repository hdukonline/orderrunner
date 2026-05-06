import { expect, Locator } from '@playwright/test';
import { sqmState } from './sqmState';
import { checkForSqmError, deriveMaxSqmValue } from './sqm';
import { GenerateRandomReference } from '../helpers/generateRandomReference';

export async function handleInput(
    input: Locator,
    option?: ConfigureValue
): Promise<string | undefined> {
    const page = input.page();
    const inputId = await input.getAttribute('id');

    let setValue: string | undefined;

    // -----------------------
    // Qty special-case
    // -----------------------
    if (
        inputId?.toLowerCase() === 'qty'
    ) {
        const qtyValue =
            option?.value ?? Math.floor(Math.random() * 5 + 1).toString();

        console.debug(`[INPUT] Filling quantity with value: ${qtyValue}`);
        await input.fill(qtyValue);
        return qtyValue;
    }

    // -----------------------
    // Special Profile Colour (RAL code) - AWN
    // -----------------------
    if (inputId === 'AWN_PRO_COL_ENT_2') {
        const ralDigits =
            option?.value ??
            Math.floor(1000 + Math.random() * 9000).toString();

        const ralValue = ralDigits.startsWith('RAL')
            ? ralDigits
            : `RAL ${ralDigits}`;

        console.debug(
            `[INPUT] Filling Special Profile Colour with value: ${ralValue}`
        );

        await input.fill(ralValue);
        await page.click('body');

        return ralValue;
    }

    const note = page.locator(`#note_${inputId}`);

    // -----------------------
    // Track width / drop intent
    // -----------------------
    const isWidth = inputId === 'BLI_WIDTH';
    const isDrop = inputId === 'BLI_DROP';

    if (isWidth && option) {
        sqmState.userPassedWidth = true;
        sqmState.width = Number(option.value);
    }

    if (isDrop && option) {
        sqmState.userPassedDrop = true;
        sqmState.drop = Number(option.value);
    }


    // -----------------------
    // Width / Drop hidden constraints
    // -----------------------
    // Width / Drop constraints exist in the DOM when Rollers
    // as notes are hidden, we can just use that instead of trying
    // to parse note text so read min/max directly without relying
    //  on visibility
    let hiddenMin: number | undefined;
    let hiddenMax: number | undefined;

    if (isWidth || isDrop) {
        const minEl = page.locator(`#${inputId}_min`);
        const maxEl = page.locator(`#${inputId}_max`);

        if ((await minEl.count()) && (await maxEl.count())) {
            hiddenMin = Number(await minEl.innerText());
            hiddenMax = Number(await maxEl.innerText());

            if (isWidth) {
                sqmState.widthMin = hiddenMin;
                sqmState.widthMax = hiddenMax;
            }

            if (isDrop) {
                sqmState.dropMin = hiddenMin;
                sqmState.dropMax = hiddenMax;
            }
        }
    }

    // -----------------------
    // Input behaviour
    // -----------------------
    let noteVisible = false;

    try {
        await note.waitFor({ state: 'visible', timeout: 3000 });
        noteVisible = true;
    } catch {
        // note did not appear within 3s – that's fine
    }

    if (option) {
        await input.fill(option.value);
        await page.click('body');

        if (isWidth) sqmState.width = Number(option.value);
        if (isDrop) sqmState.drop = Number(option.value);

        setValue = option.value;
    }

    // Width / Drop do not depend on note visibility
    else if (isWidth || isDrop || noteVisible) {

        const text = noteVisible ? await note.innerText() : '';

        const minMatch = text.match(/min:\s*([\d]+)\s*[a-z]*/i);
        const maxMatch = text.match(/max:\s*([\d]+)\s*[a-z]*/i);

        const min =
            hiddenMin ??
            (minMatch ? Number(minMatch[1]) : undefined);

        const max =
            hiddenMax ??
            (maxMatch ? Number(maxMatch[1]) : undefined);

        if (min !== undefined && max !== undefined) {

            const random =
                Math.floor(Math.random() * (max - min + 1)) + min;

            await input.fill(random.toString(), { force: true });
            await page.click('body');

            if (isWidth) sqmState.width = random;
            if (isDrop) sqmState.drop = random;

            setValue = random.toString();
        } else {
            const charMatch = text.match(/\/\s*(\d+)/);
            if (charMatch) {
                const randomString = new GenerateRandomReference(
                    page,
                    Number(charMatch[1])
                );
                const generated = await randomString.getOrGenerateReference();
                await input.fill(generated, { force: true });
                console.debug(
                    `[INPUT] Filled "${generated}" based on character limit in note`
                );
                setValue = generated;
                //return setValue;
            }
        }
    } else {
        const fallback = Math.floor(Math.random() * 100 + 1);
        await input.fill(String(fallback), { force: true });
        await page.click('body');

        if (isWidth) sqmState.width = fallback;
        if (isDrop) sqmState.drop = fallback;

        setValue = fallback.toString();
    }


    // SQM correction
    if (
        (isWidth || isDrop) &&
        sqmState.width !== undefined &&
        sqmState.drop !== undefined
    ) {
        console.debug('SQM correction check..');
        await page.waitForTimeout(400);

        const sqmMessage = await checkForSqmError(page);
        if (!sqmMessage) { return setValue; };

        console.debug('correction actioned')
        
        // both explicitly passed, hard fail as user defined (they should know the limitations)
        if (sqmState.userPassedWidth && sqmState.userPassedDrop) {
            throw new Error(`SQM violation: ${sqmMessage}`);
        }

        const unit = sqmState.unit ?? 'cm';
        const maxSqm = deriveMaxSqmValue(sqmMessage, unit);
        if (!maxSqm) { return setValue; };

        // Decide which dimension we are allowed to change
        // We change only the opposite from the user defined.
        let adjustWidth: boolean;

        if (sqmState.userPassedWidth && !sqmState.userPassedDrop) {
            adjustWidth = false;
        } else if (!sqmState.userPassedWidth && sqmState.userPassedDrop) {
            adjustWidth = true;
        } else {
            adjustWidth = false;
        }


        if (adjustWidth) {
            // WIDTH adjustment
            const maxAllowed = Math.floor(maxSqm / sqmState.drop!);

            const min = sqmState.widthMin!;
            const max = Math.min(sqmState.widthMax!, maxAllowed);

            if (max < min) {
                throw new Error('[SQM] Width cannot be corrected within bounds');
            }

            const newWidth =
                Math.floor(Math.random() * (max - min + 1)) + min;

            await page.locator('#BLI_WIDTH').fill(String(newWidth));
            await page.click('body');
            sqmState.width = newWidth;

            setValue = String(newWidth);
        } else {
            // DROP adjustment
            const maxAllowed = Math.floor(maxSqm / sqmState.width!);

            const min = sqmState.dropMin!;
            const max = Math.min(sqmState.dropMax!, maxAllowed);

            if (max < min) {
                throw new Error('[SQM] Drop cannot be corrected within bounds');
            }

            const newDrop =
                Math.floor(Math.random() * (max - min + 1)) + min;

            await page.locator('#BLI_DROP').fill(String(newDrop));
            await page.click('body');
            sqmState.drop = newDrop;

            setValue = String(newDrop);
        }
    }

    return setValue;
}
