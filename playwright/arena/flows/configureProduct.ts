import { Page } from '@playwright/test';
import { ConfigureProductPage } from '../pages/configureProductPage';
import { getVisibleFields } from '../helpers/fieldDiscovery';
import { handleDropdown } from '../actions/dropdown';
import { handleRadio } from '../actions/radio';
import { handleInput } from '../actions/input';
import { sqmState } from '../actions/sqmState';
import { takeScreenshot } from '../helpers/takeScreenshot';
import { checkForConfigError } from '../helpers/checkForConfigError';

/**
 * Drives the full product configuration flow by repeatedly discovering and
 * interacting with the set of *currently visible* configuration fields until
 * the UI reaches a stable end state.
 *
 * Core approach:
 * - The UI is treated as the single source of truth at all times.
 * - All configuration fields exist in the DOM simultaneously, but relevance
 *   is controlled via visibility (e.g. display:none).
 * - After each interaction, the DOM is re‑queried for visible fields to
 *   capture newly revealed or hidden inputs caused by onchange / validation
 *   logic.
 *
 * Field handling:
 * - Fields are processed sequentially.
 * - Each field is acted on exactly once per visibility state.
 * - Selects, radios, textareas, and inputs are handled via specialised
 *   handlers.
 *
 * Dynamic behaviour:
 * - Some controls (certain dropdowns) populate or modify options only
 *   after interaction via onchange handlers; these are triggered explicitly
 *   before options are read.
 * - Earlier selections may add, remove, or constrain later fields; this loop
 *   structure ensures those changes are respected without hard‑coding
 *   dependencies or order.
 * - Validation rules (e.g. SQM, min/max constraints) are handled reactively
 *   based on the current UI state..
 *
 * Value strategy:
 * - If an explicit value is supplied via `values[label]`, it is applied.
 * - Otherwise, a valid value is generated based on the field’s currently
 *   visible constraints (min/max, character limits, available options).
 *
 * Design intent:
 * - Prefer correctness and resilience over speed.
 * - Avoid assumptions about DOM structure, field order, or option stability.
 * - Closely model how a real user would progress through the form while
 *   remaining robust to legacy and dynamically driven UI behaviour.
 *
 * @param page Playwright Page instance.
 * @param values Optional map of label → value overrides for specific fields.
 * @param addToBasket Whether to click "Add to Basket" after configuration completes.
 */
export async function configureProduct(
    page: Page,
    screenshots?: {
        configure: boolean;
        basket: boolean;
        confirmation: boolean;
    },
    values: Record<string, ConfigureValue> = {},
    addToBasket = false,
    log?: (message: string) => void
) {

    // Reset SQM state per product
    sqmState.userPassedWidth = false;
    sqmState.userPassedDrop = false;
    sqmState.width = undefined;
    sqmState.drop = undefined;
    sqmState.unit = undefined;

    const configPage = new ConfigureProductPage(page);

    log?.("Waiting for Configure Product page to load...");
    await configPage.waitUntilLoaded();

    const handled = new Set<string>();
    let attemptedRecovery = false;

    // Loop allows a single recovery pass; all paths return or throw.
    while (true) {
        let current = await getVisibleFields(configPage);
        let index = 0;

        while (index < current.length) {
            const label = current[index];

            // Skip fields already handled
            if (handled.has(label)) {
                index++;
                continue;
            }

            const value = values[label];

            let setValue: string | undefined;

            // -------------------------
            // SPECIAL CASE: Qty
            // The Qty field cannot be reliably discovered via the normal form lookup,
            // so we explicitly target the known #qty input instead.
            // -------------------------
            if (label.toLowerCase() === 'qty' || label.toLowerCase() === 'quantity') {
                const qtyInput = page.locator('#qty');

                setValue = await handleInput(qtyInput.first(), value);
                handled.add(label);

                const updated = await getVisibleFields(configPage);

                const changed =
                    updated.length !== current.length ||
                    updated.some(f => !current.includes(f));

                if (changed) {
                    current = updated;
                }

                if (setValue !== undefined) {
                    log?.(`✔ ${label}: ${setValue ?? '[no value]'}`);
                }
                index++;
                continue;
            }

            // Field resolution strategy
            //
            // All form controls are resolved by:
            // 1) Locating the visible field label by text
            // 2) Walking up to the owning `.order-row` container
            // 3) Selecting the control type (input / select / radio / textarea)
            // 4) Explicitly excluding rows that are display:none
            //
            // This approach deliberately avoids relying on:
            // - element IDs (unstable / reused across products)
            // - DOM order (dynamic and product-dependent)
            // - hard-coded field mappings
            //
            // Visibility and ancestry are the single source of truth.
            // If a field is visible to the user, it should be discoverable here.
            const select = page.locator(
                `xpath=//div[contains(@class,'field-label')]
            [contains(normalize-space(.), '${label}')]
            /ancestor::div[contains(@class,'order-row') and not(contains(@style,'display: none'))]
            //select`
            );

            const radio = page.locator(
                `xpath=//div[contains(@class,'field-label')]
            [contains(normalize-space(.), '${label}')]
            /ancestor::div[contains(@class,'order-row') and not(contains(@style,'display: none'))]
            //input[@type='radio']`
            );

            const textarea = page.locator(
                `xpath=//div[contains(@class,'field-label')]
            [contains(normalize-space(.), '${label}')]
            /ancestor::div[contains(@class,'order-row') and not(contains(@style,'display: none'))]
            //textarea`
            );

            const input = page.locator(
                `xpath=//div[contains(@class,'field-label')]
             [contains(normalize-space(.), '${label}')]
             /ancestor::div[contains(@class,'order-row') and not(contains(@style,'display: none'))]
             //input[@type='text']`
            );

            // acts on ONE field based on type
            if (await input.count()) {
                setValue = await handleInput(input.first(), value);
            } else if (await select.count()) {
                setValue = await handleDropdown(select, value);
            } else if (await radio.count()) {
                const radioName = await radio.first().getAttribute('name');

                if (!radioName) {
                    throw new Error(`[CONFIGURE] Radio has no name for label: ${label}`);
                }

                const containerId = `input_${radioName}`;
                setValue = await handleRadio(page, containerId, value);


            } else if (await textarea.count()) {
                setValue = await handleInput(textarea.first(), value);
            } else {
                console.debug('[CONFIGURE] No control found for label:', label);
            }

            if (setValue !== undefined) {
                const icon = attemptedRecovery ? '↻' : '✔';
                log?.(`${icon} ${label}: ${setValue ?? '[no value]'}`);
                handled.add(label);
            } else {
                log?.(`${label}: something went wrong!`);
            }

            // re-evaluation
            const updated = await getVisibleFields(configPage);

            const changed =
                updated.length !== current.length ||
                updated.some(f => !current.includes(f));

            if (changed) {
                current = updated;
            }

            index++;
        }

        if (addToBasket) {

            if (page && screenshots?.configure) {
                const screenshotPath = await takeScreenshot(
                    page,
                    'order-config',
                    log
                );

                const screenshotContext = attemptedRecovery
                    ? 'after recovery attempt'
                    : 'final configuration';

                log?.(`Order screenshot captured before Add to Basket (${screenshotContext}): ${screenshotPath}`);
            }

            const basketPage = await configPage.addToBasket();

            const error = await checkForConfigError(page);

            if (!error) {
                return basketPage;
            }

            // Capture the UI exactly as it appears when the error is surfaced
            const errorScreenshotPath = await takeScreenshot(
                page,
                'order-config-error',
                log
            );

            log?.(`Order screenshot captured on configuration error: ${errorScreenshotPath}`);

            /*
             * Submission-level validation:
             *
             * At this point the UI has rejected the configuration *after* all visible
             * fields were populated. This can legitimately happen when downstream
             * selections invalidate earlier auto-generated values.
             *
             * Strategy:
             * - Never auto-correct user-supplied values, fail immediately
             * - Allow a single recovery pass for auto-generated fields by un-handling
             *   only those explicitly flagged by the UI
             * - If recovery has already been attempted, stop processing and fail
             */
            const userPassedFields = error.fields.filter(f => f in values);
            if (userPassedFields.length) {
                throw new Error(
                    `[CONFIG ERROR] User-passed field(s) invalid: ${userPassedFields.join(', ')}`
                );
            }

            if (attemptedRecovery) {
                throw new Error(`[CONFIG ERROR] ${error.message}`);
            }

            log?.(
                `[INFO] Configuration options are evaluated at selection time. `
                + `Later changes may invalidate earlier fields. `
                + `Re-selecting: ${error.fields.join(', ')}`
            );

            attemptedRecovery = true;

            console.debug(
                '[CONFIG] Resetting invalid auto-filled fields:',
                error.fields
            );

            // Allow only the rejected fields to be reprocessed
            for (const field of error.fields) {
                handled.delete(field);
            }
        }
    }
}
