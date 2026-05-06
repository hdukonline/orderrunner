export function formatIdoc(raw: string): string {
    const cleaned = raw
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\n\s*\n+/g, '\n\n');

    const lines = cleaned.split('\n');

    lines[0] = lines[0].trimStart();

    return lines.join('\n');
}