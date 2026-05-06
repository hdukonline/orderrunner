import { createAlert } from "../core/alert/alert.js";
import { createAlertManager } from "../core/alert/alertManager.js";
import { copyTextToClipboard } from "../core/utils/clipboard.js";
import { formatIdoc } from "../core/utils/formatIdoc.js";
import { escapeHtml } from "../core/utils/html.js";
import { productTypeMap } from "../core/utils/productTypes.js";
import { setSideNavDisabled } from "../core/utils/setSideNavDisabled.js";

type ProductCategory = keyof typeof productTypeMap;

export async function initRunnerPage() {
    let environments: any[] = [];

    // Main options
    const siteSelect = document.getElementById("site") as HTMLSelectElement | null;
    const environmentSelect = document.getElementById("env") as HTMLSelectElement;
    const jsonViewer = document.getElementById("env-json") as HTMLDivElement | null;
    const jsonInfo = document.getElementById("env-info") as HTMLDivElement | null;
    const testSelect = document.getElementById("test") as HTMLSelectElement;
    const browserSelect = document.getElementById("browser") as HTMLSelectElement;
    const productCategorySelect = document.getElementById("product-category") as HTMLSelectElement | null;
    const productCategoryWrapper = document.getElementById("product-category-wrapper") as HTMLSelectElement | null;
    const productTypeWrapper = document.getElementById("product-type-wrapper") as HTMLDivElement | null;
    const productTypeSelect = document.getElementById("product-type") as HTMLSelectElement | null;
    const runsInput = document.getElementById("runs") as HTMLInputElement;

    // Advance options
    const headlessCheck = document.getElementById("headless") as HTMLInputElement;
    const slowChecked = document.getElementById("test-slow") as HTMLInputElement;

    // Order options
    const submitCheck = document.getElementById("submit-order") as HTMLInputElement;
    const saveOrderCheck = document.getElementById("save-only") as HTMLInputElement;
    const returnIdocChecked = document.getElementById("return-idoc") as HTMLInputElement;

    // Screenshot options
    const ssConfigure = document.getElementById("ss-configure") as HTMLInputElement | null;
    const ssBasket = document.getElementById("ss-basket") as HTMLInputElement | null;
    const ssConfirmation = document.getElementById("ss-confirmation") as HTMLInputElement | null;
    const ssUnsubmitted = document.getElementById("ss-unsubmitted") as HTMLInputElement | null;

    // Alerts
    const alertsContainer = document.getElementById("alerts")!;
    const alertManager =
        alertsContainer ? createAlertManager(alertsContainer) : null;

    // run - cancel options    
    const runBtn = document.getElementById("runBtn") as HTMLButtonElement;
    const cancelBtn = document.getElementById("cancelBtn") as HTMLButtonElement;

    // Progress state
    const outputBox = document.getElementById("output") as HTMLPreElement;
    const statusLabel = document.getElementById("status") as HTMLDivElement;
    const progressBar = document.getElementById("progress") as HTMLDivElement;

    const copyOutputBtn = document.getElementById("copyOutputBtn") as HTMLButtonElement;
    const testContainer = document.getElementById("test-container") as HTMLDivElement | null;

    // Sanity check for critical elements
    if (!runBtn || !testSelect) {
        console.warn("Runner page elements not found yet.");
        return;
    }

    // State variables
    let running = false;
    let completedRuns = 0;

    // check state of save-only and submit-order
    function updateSubmitSaveState(e: Event) {
        (e.target === submitCheck)
            ? saveOrderCheck.checked = false
            : submitCheck.checked = false;

        updateScreenshotState();
    }

    saveOrderCheck.addEventListener("change", updateSubmitSaveState);
    submitCheck.addEventListener("change", updateSubmitSaveState);

    saveOrderCheck.addEventListener("change", updateRunButtonState);
    submitCheck.addEventListener("change", updateRunButtonState);

    // Function to enable/disable run button based on form state and running state
    function updateRunButtonState() {
        if (running) {
            runBtn.disabled = true;
            return;
        }

        const siteSelected = siteSelect?.value !== "";
        const environmentSelected = environmentSelect.value !== "";
        const browserSelected = browserSelect.value !== "";

        const testRequired = testContainer?.hidden === false;
        const testSelected = testRequired ? testSelect.value !== "" : true;

        // if order options are shown, one of these must be true
        const orderValid = validateOrderOptions();

        // final decision
        runBtn.disabled = !(
            siteSelected &&
            browserSelected &&
            environmentSelected &&
            testSelected &&
            orderValid
        );
    }

    async function updateScreenshotCount() {
        const el = document.querySelector(
            '#clear-screenshots .font-medium'
        ) as HTMLSpanElement | null;

        if (!el) return;

        const count = await window.api.getScreenshotCount();
        el.textContent = `Clear Screenshots [${count}]`;
    }

    function validateOrderOptions(): boolean {
        const selectedTestOption =
            testSelect.options[testSelect.selectedIndex];

        const supportsOrder =
            selectedTestOption?.dataset.capability === "order";

        // No order requirements for non-order tests
        if (!supportsOrder) return true;

        if (!(submitCheck.checked || saveOrderCheck.checked)) {
            return false;
        }

        if (!productCategorySelect || !productCategorySelect.value) {
            return false;
        }

        if (!productTypeSelect || !productTypeSelect.value) {
            return false;
        }

        return true;
    }

    environments = await window.api.loadEnvironments();

    // Populate site and environment dropdowns
    const capitalizeFirst = (str: string) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    const addedSites = new Set<string>();

    environments.forEach(env => {
        const site = capitalizeFirst(env.site);
        const mode = capitalizeFirst(env.mode);

        if (!addedSites.has(env.site)) {
            addedSites.add(env.site);

            siteSelect?.insertAdjacentHTML(
                "beforeend",
                `<option value="${env.site}">${site}</option>`
            );
        }

    });

    function updateSlowAlert() {
        if (!alertManager || !slowChecked) return;

        const alertId = "slow";
        if (!slowChecked.checked) {
            alertManager.removeAlert(alertId);
            return;
        }

        const alert = createAlert({
            id: alertId,
            type: "info",
            title: "Slow Mode",
            message:
                "Extra time is allowed in case this is the first request and the site is cold-starting.",
        });

        alertManager.showAlert(alert);
    }

    function updateReturnIdocAlert() {
        if (!alertManager) return;

        const alertId = "idoc";

        if (!returnIdocChecked || !returnIdocChecked.checked) {
            alertManager.removeAlert(alertId);
            return;
        }

        if (siteSelect?.value.toLowerCase() === "arena") {
            const alert = createAlert({
                id: alertId,
                type: "info",
                title: "Return Idoc",
                message:
                    "Returning Idocs in Arena requires membership of the <Group Name> user group. " +
                    "Without this, enabling the option will have no effect.",

            });

            alertManager.showAlert(alert);
        }
    }

    // toggle slow alert 
    slowChecked?.addEventListener("change", updateSlowAlert);

    // toggle return idoc alert
    returnIdocChecked?.addEventListener("change", updateReturnIdocAlert);

    updateSlowAlert();

    productTypeSelect?.addEventListener("change", updateRunButtonState);

    productCategorySelect?.addEventListener("change", () => {
        if (!productTypeSelect || !productTypeWrapper) return;

        const category = productCategorySelect.value as ProductCategory;

        // Always reset
        productTypeSelect.innerHTML =
            `<option value="">--- Please Choose ---</option>`;
        productTypeWrapper.classList.add("hidden");

        if (!category || !productTypeMap[category]) {
            updateRunButtonState();
            return;
        }

        const types = productTypeMap[category];
        const entries = Object.entries(types);

        if (entries.length === 0) {
            updateRunButtonState();
            return;
        }

        for (const [label, value] of entries) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            productTypeSelect.appendChild(option);
        }

        productTypeWrapper.classList.remove("hidden");
        updateRunButtonState();
    });

    // Environment select listener to show JSON details
    environmentSelect?.addEventListener("change", () => {
        if (!alertManager) return;

        const selected = environmentSelect.value;

        if (!selected) {
            if (jsonViewer) {
                jsonViewer.textContent = "";
            }
            jsonInfo?.classList.add("hidden");

            alertManager.removeAlert("production");

            submitCheck.checked = false;
            submitCheck.disabled = false;

            return;
        }

        const env = environments.find(e => e.id === selected);

        if (!env) {
            if (jsonViewer) {
                jsonViewer.textContent = "// No matching environment found";
            }
            return;
        }

        if (jsonViewer && jsonInfo) {
            jsonInfo.classList.remove("hidden");
            renderEnvJson(env);
        }

        //console.log("Selected environment:", env);

        if (env.mode.toLowerCase() === "prod") {
            const alert = createAlert({
                id: "production",
                type: "danger",
                title: "Warning",
                message: "Production mode is active. Please verify all details before continuing. Order submission is not permitted.",
            });

            alertManager.showAlert(alert);
            submitCheck.checked = false;
            submitCheck.disabled = true;

        } else {
            alertManager.removeAlert("production");
            submitCheck.disabled = false;
        }
    });

    // Render environment JSON with password blurred out and revealed on hover
    function renderEnvJson(env: any) {
        if (!jsonViewer) return;

        let json = JSON.stringify(env, null, 2);

        const passwordLine = `"password": "${env.password}"`;

        const passwordHtml =
            `"password": <span class="blur-sm group-hover:blur-none transition">${env.password}</span>`;

        json = json.replace(passwordLine, passwordHtml);

        jsonViewer.innerHTML =
            `<div class="group font-mono whitespace-pre text-sm p-4">${json}</div>`;

    }

    // Site select listener to filter tests and apply theme
    if (siteSelect) {
        siteSelect.addEventListener("change", () => {
            const selectedSite = siteSelect.value;
            testSelect.value = "";

            // Reset environment dropdown
            if (environmentSelect) {
                environmentSelect.innerHTML = `<option value="">--- Please Choose ---</option>`;
                environmentSelect.value = "";

            }

            // Populate only environments for this site
            environments
                .filter(env => env.site === selectedSite)
                .forEach(env => {
                    const site = capitalizeFirst(env.site);
                    const mode = capitalizeFirst(env.mode);

                    environmentSelect?.insertAdjacentHTML(
                        "beforeend",
                        `<option data-site="${env.site}" value="${env.id}">
                        ${site} - ${mode.toUpperCase()}
                    </option>`
                    );
                });

            // Filter test dropdown
            Array.from(testSelect.options).forEach(option => {
                const site = option.dataset.site;

                if (!site) {
                    option.disabled = false;
                    option.hidden = false;
                    return;
                }

                const allowed = site === selectedSite;
                option.disabled = !allowed;
                option.hidden = !allowed;
            });

            if (testSelect.selectedOptions[0]?.disabled) {
                testSelect.value = "";
            }

            jsonInfo?.classList.add("hidden");

            runBtn.classList.remove(
                "bg-blue-500",
                "hover:bg-blue-700",
                "bg-indigo-500",
                "hover:bg-indigo-700",
                "bg-gray-600",
                "hover:bg-gray-500"
            );

            progressBar.classList.remove("bg-blue-600", "bg-indigo-600");

            if (selectedSite === "arena") {
                runBtn.classList.add("bg-blue-500", "hover:bg-blue-700");
                progressBar.classList.add("bg-blue-600");
            } else if (selectedSite === "portal") {
                runBtn.classList.add("bg-indigo-500", "hover:bg-indigo-700");
                progressBar.classList.add("bg-indigo-600");
            } else {
                runBtn.classList.add("bg-gray-600", "hover:bg-gray-500");
            }

            updateRunButtonState();
        });
    }

    // Order options
    function updateOrderOptionsVisibility() {
        const selectedOption =
            testSelect.options[testSelect.selectedIndex];

        const supportsOrder =
            selectedOption?.dataset.capability === "order";


        // Toggle Product Category visibility
        productCategoryWrapper?.classList.toggle("hidden", !supportsOrder);

        if (!supportsOrder) {
            productCategorySelect && (productCategorySelect.value = "");

            productTypeWrapper?.classList.add("hidden");
            productTypeSelect &&
                (productTypeSelect.innerHTML =
                    `<option value="">--- Please Choose ---</option>`);
        }

        document
            .querySelectorAll<HTMLElement>(".order-lifecycle-group")
            .forEach(el => {
                const shouldHide = !supportsOrder;

                // Hide / show
                el.classList.toggle("hidden", shouldHide);

                // When hidden → uncheck inputs
                if (shouldHide) {
                    el.querySelectorAll<HTMLInputElement>(
                        'input[type="checkbox"], input[type="radio"]'
                    ).forEach(input => {
                        input.checked = false;
                    });
                }

            });
    }
    updateOrderOptionsVisibility();

    Array.from(testSelect.options).forEach(option => {
        if (option.dataset.site) {
            option.hidden = true;
        }
    });


    // Test select listener to enable run button ---
    browserSelect.addEventListener("change", updateRunButtonState);
    testSelect.addEventListener("change", updateRunButtonState);
    environmentSelect.addEventListener("change", updateRunButtonState);
    productCategorySelect?.addEventListener("change", updateRunButtonState);
    productTypeSelect?.addEventListener("change", updateRunButtonState);

    testSelect.addEventListener("change", updateOrderOptionsVisibility);
    testSelect.addEventListener("change", updateReturnIdocAlert);
    siteSelect?.addEventListener("change", updateOrderOptionsVisibility);
    siteSelect?.addEventListener("change", updateReturnIdocAlert);

    function linkifyScreenshots(text: string, colour: string = '') {
        const screenshotMatch = text.match(/([A-Za-z]:\\[^ ]+\.png|\/[^ ]+\.png)/);
        if (!screenshotMatch) return text;

        const filePath = screenshotMatch[0];
        return text.replace(
            filePath,
            `<a href="#" class="screenshot-link ${colour || "text-primary"} underline" data-path="${filePath}">${filePath}</a>`
        );
    }

    // Append logs to the output box with timestamps ---
    function appendLog(message: string) {

        const timestamp = new Date().toLocaleTimeString();

        const idocMatch = message.match(/^IDOC:\s*([\s\S]+)$/);
        if (idocMatch) {
            const formattedIdoc = formatIdoc(idocMatch[1]);
            outputBox.innerHTML += `
                <div class="log-line flex flex-col gap-1">
                    <span class="timestamp text-[#C3C0FF] px-1 py-[1px] rounded whitespace-nowrap">
                        [${timestamp}]
                    </span>
                    <pre class="message text-xs text-[#C3C0FF] p-2 rounded overflow-auto whitespace-pre-wrap break-words">${escapeHtml(formattedIdoc)}</pre>
                </div>
            `;

            return;
        }

        const refMatch = message.match(/^REF:(.+)$/);
        if (refMatch) {
            const ref = refMatch[1];

            outputBox.innerHTML += `
                <div class="log-line flex items-start gap-2">
                  <span class="timestamp text-[#C3C0FF] px-1 py-[1px] rounded whitespace-nowrap">
                    [${timestamp}]
                  </span>
                  <span class="message break-all">
                    Order Reference:
                    <span class="text-[#C3C0FF] font-semibold">
                      ${ref}
                    </span>
                  </span>
                </div>
            `;

            return;
        }

        // ERROR handling - if message starts with "ERROR:" treat it as an error log and style accordingly. 
        const cleanMessage = message.replace(/\x1B\[[0-9;]*m/g, '');
        const errorMatch = cleanMessage.match(/^ERROR:\s*([\s\S]+)$/);
        if (errorMatch) {
            const rawError = errorMatch[1].trim();
            const error = linkifyScreenshots(rawError, " text-red-500");

            outputBox.innerHTML += `
              <div class="log-line flex items-start gap-2">
                <span class="timestamp text-[#C3C0FF] px-1 py-[1px] rounded whitespace-nowrap">
                  [${timestamp}]
                </span>
                <span class="message break-all text-red-500">
                  ${error}
                </span>
              </div>
            `;
            return;
        }

        const htmlMessage = linkifyScreenshots(message);
        outputBox.innerHTML +=
            `<div class="log-line flex items-start gap-2">
            <span class="timestamp text-[#C3C0FF] px-1 py-[1px] rounded whitespace-nowrap">[${timestamp}]</span>
            <span class="message break-all">${htmlMessage}</span>
        </div>`;

        outputBox.scrollTop = outputBox.scrollHeight;
    }


    function setupSidebarActions(log: (msg: string) => void) {
        const clearBtn = document.getElementById('clear-screenshots');
        if (!clearBtn) return;

        clearBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            await window.api.clearScreenshots();
            log('Screenshots cleared');
            updateScreenshotCount()
        });
    }
    setupSidebarActions(appendLog);

    copyOutputBtn.addEventListener("click", async () => {
        await copyTextToClipboard(outputBox.innerText);

        const original = copyOutputBtn.textContent;
        copyOutputBtn.textContent = "Copied";
        setTimeout(() => {
            copyOutputBtn.textContent = original;
        }, 1200);
    });

    outputBox.addEventListener("click", e => {
        const target = e.target as HTMLElement;

        e.preventDefault();

        if (target.classList.contains("screenshot-link")) {
            const filePath = target.dataset.path;
            window.api.openFile(filePath as string);
        }
    });


    function updateScreenshotState() {
        // Confirmation depends on Submit Order
        if (ssConfirmation) {
            if (submitCheck.checked) {
                ssConfirmation.disabled = false;
            } else {
                ssConfirmation.checked = false;
                ssConfirmation.disabled = true;
            }
        }

        // Unsubmitted depends on Save Order
        if (ssUnsubmitted) {
            if (saveOrderCheck.checked) {
                ssUnsubmitted.disabled = false;
            } else {
                ssUnsubmitted.checked = false;
                ssUnsubmitted.disabled = true;
            }
        }
    }

    submitCheck.addEventListener("change", updateScreenshotState);
    saveOrderCheck.addEventListener("change", updateScreenshotState);
    updateScreenshotState();

    // Run button click listener
    let cancelRequested = false;
    runBtn.addEventListener("click", async () => {
        if (running) return;

        const productType = productTypeSelect?.value.toUpperCase();
        if (productType === "PYT" || productType === "PYF") {
            appendLog(
                "ERROR: 'PYT' and 'PYF' cannot be generated randomly due to shape-based dimensional constraints. Manual configuration is required."
            );
            return;
        }

        running = true;
        setSideNavDisabled(true);
        completedRuns = 0;
        updateRunButtonState();
        cancelBtn.disabled = false;
        copyOutputBtn

        outputBox.textContent = "";
        statusLabel.textContent = "Running...";
        progressBar.style.width = "0%";

        const selectedEnv = environments.find(e => e.id === environmentSelect?.value);

        const options: RunOptions = {
            test: testSelect.value,
            site: testSelect.selectedOptions[0]?.dataset.site,
            browser: browserSelect.value.toLowerCase() as "chromium" | "firefox" | "webkit",
            runs: Number(runsInput.value),
            headless: headlessCheck.checked,
            username: selectedEnv?.username,
            password: selectedEnv?.password,
            url: selectedEnv?.url,
            environment: selectedEnv?.mode,
            slow: slowChecked.checked,
            saveOrder: saveOrderCheck.checked,
            returnIdoc: returnIdocChecked.checked,
            submitOrder: submitCheck.checked,
            reference: undefined, // todo: This is a placeholder
            productCategory: productCategorySelect?.value ?? "",
            configureValues: {
                "Product Lining Type": { by: 'value', value: productType ?? "" },
                "Product Type": { by: 'value', value: productType ?? "" },
            },
            screenshots: {
                configure: ssConfigure?.checked ?? false,
                basket: ssBasket?.checked ?? false,
                confirmation: ssConfirmation?.checked ?? false,
                unsubmittedOrders: ssUnsubmitted?.checked ?? false
            },

        };

        appendLog("Sending options to main process...");
        const masked = { ...options };
        if ("password" in masked) masked.password = "*****";
        if ("username" in masked) masked.username = "*****";
        appendLog(JSON.stringify(masked, null, 2));

        try {
            for (let i = 0; i < options.runs; i++) {
                if (cancelRequested) {
                    appendLog("Run cancelled by user.");
                    break;
                }

                completedRuns = i;
                appendLog(`\nRun ${i + 1} of ${options.runs}...`);
                await window.api.runTest(options);
                progressBar.style.width = `${((i + 1) / options.runs) * 100}%`;
            }

            statusLabel.textContent = "Completed";
        } catch (err: any) {
            appendLog(`Error: ${err.message}`);
            statusLabel.textContent = "Error";
        }

        running = false;
        setSideNavDisabled(false);
        cancelRequested = false;
        cancelBtn.disabled = true;
        copyOutputBtn.disabled = false;
        updateRunButtonState();
        updateScreenshotCount();
    });

    // Cancel button click listener
    cancelBtn.addEventListener("click", () => {
        cancelRequested = true;
        appendLog("Cancel requested. Will stop after current step...");
        cancelBtn.disabled = true;
    });

    // Listen for logs from main process
    window.api.onTestLog((msg: string) => {
        appendLog(msg);
    });

    // Initial button state
    updateScreenshotCount();
    updateRunButtonState();
}
