import { loadHTML } from "./core/loadHtml.js";
import { setupSidebarNavigation } from "./core/navigation.js";
import { loadPage } from "./core/pageLoader.js";

async function init() {
    await loadHTML("sidebar-container", "./sidebar.html");
    setupSidebarNavigation();
    loadPage("runner"); // default
}

document.addEventListener("DOMContentLoaded", init);