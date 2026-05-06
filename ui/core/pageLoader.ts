import { loadHTML } from "./loadHtml.js";
import { initRunnerPage } from ".././pages/runner.js";
import { initEnvironmentPage } from ".././pages/environment.js";

export async function loadPage(page: string) {
    await loadHTML("main-container", `./pages/${page}.html`);

    if (page === "runner") initRunnerPage();
    if (page === "environment") initEnvironmentPage();
}