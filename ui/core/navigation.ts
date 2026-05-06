import { loadPage } from "./pageLoader.js";

export function setupSidebarNavigation(): void {
    const sidebar = document.getElementById("sidebar-container");
    if (!sidebar) return console.error("Sidebar not found");

    sidebar.addEventListener("click", (ev) => {
        const target = ev.target as HTMLElement;
        const link = target.closest("[data-page]") as HTMLElement | null;
        if (!link) return;

        const allLinks = sidebar.querySelectorAll("[data-page]");
        allLinks.forEach((el) => {
            el.classList.remove("bg-[#353534]", "text-[#C3C0FF]", "border-right-2", "border-[#7CD0FF]");
            el.classList.add("text-[#C7C4D8]", "hover:text-white", "hover:bg-[#2A2A2A]");
        });

        link.classList.remove("text-[#C7C4D8]", "hover:text-white", "hover:bg-[#2A2A2A]");
        link.classList.add("bg-[#353534]", "text-[#C3C0FF]", "border-right-2", "border-[#7CD0FF]");

        const page = link.dataset.page;
        if (page) loadPage(page);
    });
}