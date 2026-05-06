
export function initEnvironmentPage() {

    // document elements
    const envSiteSelect = document.getElementById("env-site") as HTMLSelectElement;
    const urlInput = document.getElementById("env-url") as HTMLInputElement;
    const modeSelect = document.getElementById("env-mode") as HTMLSelectElement;
    const usernameInput = document.getElementById("env-username") as HTMLInputElement;
    const passwordInput = document.getElementById("env-password") as HTMLInputElement;

    const iconGrid = document.getElementById("env-icon-grid") as HTMLDivElement;
    const saveBtn = document.getElementById("env-save") as HTMLButtonElement;

    const listContainer = document.getElementById("env-list") as HTMLDivElement;
    const countLabel = document.getElementById("env-count") as HTMLSpanElement;

    if (!envSiteSelect || !urlInput || !modeSelect || !iconGrid || !listContainer) {
        console.warn("Environment page elements missing.");
        return;
    }

    // Icon options (could be extended to allow custom icons in the future)
    const ICONS = [
        { id: "public", label: "Public" }
    ];

    // State variables
    let environments: Array<any> = [];
    let selectedIcon: string | null = null;
    let editIndex: number | null = null;

    /* ---------------------------------------------------------------*/
    /* VALIDATION - DISABLE SAVE BUTTON UNTIL FORM IS COMPLETE       /*
    /* ---------------------------------------------------------------*/
    function validate() {
        const ready =
            envSiteSelect.value.trim() !== "" &&
            urlInput.value.trim() !== "" &&
            modeSelect.value.trim() !== "" &&
            usernameInput.value.trim() !== "" &&
            passwordInput.value.trim() !== "" &&
            selectedIcon !== null;

        saveBtn.disabled = !ready;

        if (!ready) {
            saveBtn.classList.add("opacity-40", "cursor-not-allowed");
        } else {
            saveBtn.classList.remove("opacity-40", "cursor-not-allowed");
        }
    }

    envSiteSelect.addEventListener("change", validate);
    urlInput.addEventListener("input", validate);
    modeSelect.addEventListener("change", validate);
    usernameInput.addEventListener("input", validate);
    passwordInput.addEventListener("input", validate);

    /* ---------------------------------------------------------------*/
    /* ICON GRID                                                      /*
    /* ---------------------------------------------------------------*/
    function renderIconGrid() {
        iconGrid.innerHTML = "";

        ICONS.forEach(icon => {
            const btn = document.createElement("button");
            btn.className =
                "env-icon-item flex flex-col items-center justify-center gap-1 p-4 rounded-lg " +
                "bg-surface-container-high hover:bg-surface-container-highest border border-outline/20 " +
                "transition cursor-pointer text-on-surface-variant";
            btn.dataset.icon = icon.id;

            btn.innerHTML = `
                <span class="material-symbols-outlined text-xl">${icon.id}</span>
                <span class="text-xs">${icon.label}</span>
            `;

            btn.addEventListener("click", () => {
                selectedIcon = icon.id;
                highlightIcon();
                validate();
            });

            iconGrid.appendChild(btn);
        });
    }

    function highlightIcon() {
        document.querySelectorAll(".env-icon-item").forEach(btn => {
            const el = btn as HTMLElement;

            if (el.dataset.icon === selectedIcon) {
                el.classList.add("border-primary", "text-primary");
            } else {
                el.classList.remove("border-primary", "text-primary");
            }
        });
    }

    /* ---------------------------------------------------------------*/
    /* RENDER ENVIRONMENT LIST                                        /*
    /* ---------------------------------------------------------------*/
    function renderEnvList() {
        listContainer.innerHTML = "";

        environments.forEach((env, index) => {
            //console.log(env, index);
            const row = document.createElement("div");
            row.className =
                "group flex items-center justify-between p-5 bg-surface-container rounded-xl " +
                "hover:bg-surface-container-high transition-all border border-transparent " +
                "hover:border-outline-variant/10";

            row.innerHTML = `
                <div class="flex items-center gap-5">
                    <div class="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined">${env.icon}</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-on-surface">${env.site?.toUpperCase()} : ${env.mode.toUpperCase()} Environment</h4>
                        <p class="text-xs font-mono text-outline">${env.url}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button data-edit="${index}" class="p-2 text-on-surface-variant hover:text-primary">
                        <span class="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button data-delete="${index}" class="p-2 text-on-surface-variant hover:text-error">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            `;

            listContainer.appendChild(row);
        });

        countLabel.textContent = `${environments.length} INSTANCES CONFIGURED`;

        // delete listeners
        document.querySelectorAll("[data-delete]").forEach(btn => {
            btn.addEventListener("click", () => {
                const i = Number((btn as HTMLElement).dataset.delete);
                environments.splice(i, 1);
                window.api.saveEnvironments(environments);
                renderEnvList();
                clearForm();
            });
        });

        // edit listeners
        document.querySelectorAll("[data-edit]").forEach(btn => {
            btn.addEventListener("click", () => {
                const i = Number((btn as HTMLElement).dataset.edit);
                loadIntoForm(i);
            });
        });
    }

    /* ---------------------------------------------------------------*/
    /* SAVE / UPDATE ENVIRONMENT                                      /*
    /* ---------------------------------------------------------------*/
    saveBtn.addEventListener("click", () => {
        const env = {
            id: editIndex === null ? crypto.randomUUID() : environments[editIndex].id,
            site: envSiteSelect.value.trim(),
            url: urlInput.value.trim(),
            mode: modeSelect.value.trim(),
            username: usernameInput.value.trim(),
            password: passwordInput.value.trim(),
            icon: selectedIcon
        };

        if (editIndex === null) {
            environments.push(env);
        } else {
            environments[editIndex] = env;
            editIndex = null;
        }

        window.api.saveEnvironments(environments);
        renderEnvList();
        clearForm();
    });

    /* ---------------------------------------------------------------*/
    /* LOAD ENVIRONMENT INTO FORM (EDIT MODE)                         /*
    /* ---------------------------------------------------------------*/
    function loadIntoForm(i: number) {
        const env = environments[i];
        editIndex = i;

        envSiteSelect.value = env.site;
        urlInput.value = env.url;
        modeSelect.value = env.mode;
        usernameInput.value = env.username;
        passwordInput.value = env.password;

        selectedIcon = env.icon;
        highlightIcon();

        saveBtn.textContent = "Update Environment";

        validate();
    }

    /* ---------------------------------------------------------------*/
    /* CLEAR FORM                                                      /*
    /* ---------------------------------------------------------------*/
    function clearForm() {
        envSiteSelect.value = "";
        urlInput.value = "";
        modeSelect.value = "";
        usernameInput.value = "";
        passwordInput.value = "";
        selectedIcon = null;

        highlightIcon();
        saveBtn.textContent = "Save Environment";
        validate();
    }

    /* ---------------------------------------------------------------*/
    /* INIT                                                           /*
    /* ---------------------------------------------------------------*/

    renderIconGrid();
    validate();

    // Load persisted environments from JSON file
    window.api.loadEnvironments().then((saved) => {
        environments = saved || [];
        renderEnvList();
    });
}
