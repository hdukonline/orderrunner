export async function copyTextToClipboard(text: string): Promise<void> {
    const value = text.trim();
    if (!value) return;

    await navigator.clipboard.writeText(value);
}