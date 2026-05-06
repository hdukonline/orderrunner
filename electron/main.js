import path from "path";
import { ipcMain, app, BrowserWindow, screen } from "electron";
import { runTest } from '../playwright/runner.js';
import fs from "fs";
/**
 * ----------------------------
 * DPI Fix for Windows
 * ----------------------------
 * Ensures Windows does not auto-scale your app window
 * This prevents tiny/huge UI on high-DPI monitors.
 */
if (process.platform === 'win32') {
    app.commandLine.appendSwitch('high-dpi-support', 'true');
    app.commandLine.appendSwitch('force-device-scale-factor', '1');
}
/**
 * ----------------------------
 * IPC handler
 * ----------------------------
 * Allows renderer to call Playwright runner and stream logs back.
 */
ipcMain.handle('run-test', async (event, options) => {
    const webContents = event.sender;
    return await runTest(options, (message) => {
        webContents.send('test-log', message);
    });
});
/**
 * ----------------------------
 * IPC handler to open files
 * ----------------------------
 * Allows renderer to ask main process to open files (e.g. screenshots, reports)
 */
ipcMain.handle("open-file", async (event, filePath) => {
    const { shell } = require("electron");
    await shell.openPath(filePath);
});
/* ------------------------------------------------------------------ */
/* ENVIRONMENT JSON SAVE / LOAD IPC                                   */
/* ------------------------------------------------------------------ */
// Store file here: %APPDATA%/<YourApp>/environments.json
function getEnvFilePath() {
    return path.join(app.getPath("userData"), "environments.json");
}
// Save environments
ipcMain.handle("env-save", async (_event, envs) => {
    const file = getEnvFilePath();
    fs.writeFileSync(file, JSON.stringify(envs, null, 2), "utf-8");
    return true;
});
// Load environments
ipcMain.handle("env-load", async () => {
    const file = getEnvFilePath();
    if (!fs.existsSync(file))
        return [];
    return JSON.parse(fs.readFileSync(file, "utf-8"));
});
/**
 * ----------------------------
 * Create the main window
 * ----------------------------
 */
function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const scale = primaryDisplay.scaleFactor || 1;
    const win = new BrowserWindow({
        minWidth: 900,
        minHeight: 860,
        webPreferences: {
            preload: path.resolve(app.getAppPath(), 'dist/electron/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // Hide the top menu bar (File, Edit, View etc. - you can still access it with Alt key on Windows)
    win.setAutoHideMenuBar(true);
    win.setMenuBarVisibility(false);
    const indexPath = path.join(app.getAppPath(), 'dist/ui/index.html');
    win.loadFile(indexPath);
    /**
     * ----------------------------
     * Zoom-out adjustment
     * ----------------------------
     */
    const zoomOutMultiplier = 1;
    win.webContents.setZoomFactor(zoomOutMultiplier / scale);
    // Optional: open DevTools for debugging
    // win.webContents.openDevTools();
}
/**
 * ----------------------------
 * Handle multi-monitor scaling
 * ----------------------------
 * Adjust zoom if window moves to a monitor with different DPI.
 */
app.on('browser-window-created', (_e, window) => {
    window.on('move', () => {
        const scale = screen.getDisplayMatching(window.getBounds()).scaleFactor;
        const zoomOutMultiplier = 1; // <-- SAME VALUE HERE FOR CONSISTENCY
        window.webContents.setZoomFactor(zoomOutMultiplier / scale);
    });
});
/**
 * ----------------------------
 * App lifecycle
 * ----------------------------
 */
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});
