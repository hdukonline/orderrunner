const fs = require('fs');
const path = require('path');

function clearScreenshots(log?: (msg: string) => void): void {
    const dir = path.resolve('screenshots');

    if (!fs.existsSync(dir)) {
        log?.('No screenshots folder to clear');
        return;
    }

    const files = fs.readdirSync(dir);
    let deleted = 0;

    for (const file of files) {
        if (!file.endsWith('.png')) continue;

        try {
            fs.unlinkSync(path.join(dir, file));
            deleted++;
        } catch {
            log?.(`Failed to delete screenshot: ${file}`);
        }
    }

    log?.(`Cleared ${deleted} screenshot(s)`);
}

module.exports = {
    clearScreenshots,
};
