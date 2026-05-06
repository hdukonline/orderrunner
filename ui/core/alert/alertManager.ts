export function createAlertManager(container: HTMLElement) {
    function removeAlert(id: string) {
        const alert = container.querySelector(
            `[data-alert-id="${id}"]`
        );
        alert?.remove();
    }

    function showAlert(alert: HTMLElement) {
        const id = alert.dataset.alertId;
        if (id) {
            removeAlert(id);
        }
        container.appendChild(alert);
    }

    function clearAll() {
        container.innerHTML = "";
    }

    return {
        showAlert,
        removeAlert,
        clearAll,
    };
}