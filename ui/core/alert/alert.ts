export type AlertType = "danger" | "success" | "warning" | "info";

interface AlertOptions {
    id?: string;
    type?: AlertType;
    title?: string;
    message: string;
}

export function createAlert(options: AlertOptions): HTMLElement {
    const { id, type = "danger", title, message } = options;

    const colors: Record<AlertType, string> = {
        danger: "text-red-800 bg-red-100 border-red-300",
        success: "text-green-800 bg-green-100 border-green-300",
        warning: "text-yellow-800 bg-yellow-100 border-yellow-300",
        info: "text-blue-800 bg-blue-100 border-blue-300",
    };

    const el = document.createElement("div");

    if (id) {
        el.dataset.alertId = id;
    }

    el.className = `
    flex items-center justify-between gap-4 p-4 mb-4 text-sm border rounded-lg
    ${colors[type]}
  `;

    const content = document.createElement("div");
    content.className = "flex-1";

    const text = document.createElement("span");

    if (title) {
        const titleSpan = `<span class="font-medium">${title}:</span> `;
        text.innerHTML = titleSpan + message;
    } else {
        text.textContent = message;
    }

    content.appendChild(text);

    const closeBtn = document.createElement("button");
    closeBtn.className = "ml-auto text-lg opacity-60 hover:opacity-100";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => el.remove());

    el.appendChild(content);
    el.appendChild(closeBtn);

    return el;
}