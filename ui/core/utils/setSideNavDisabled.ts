export function setSideNavDisabled(disabled: boolean) {
    const nav = document.querySelector("nav");
    if (!nav) return;

    nav.classList.toggle("nav-locked", disabled);
}
