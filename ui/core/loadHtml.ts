
export async function loadHTML(id: string, file: string): Promise<void> {
    //console.log(`Loading HTML: ${file} into #${id}`);
    const container = document.getElementById(id);
    if (!container) return console.error(`Container #${id} not found`);
    try {
        const response = await fetch(file);
        container.innerHTML = await response.text();
    } catch (err) {
        console.error(`Failed to load ${file}:`, err);
    }
}