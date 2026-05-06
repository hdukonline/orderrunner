import path from "path";
import { ipcMain, app, BrowserWindow, screen } from "electron";
import { runTest, RunOptions } from '../playwright/runner.js';
import fs from "fs";
const { clearScreenshots } = require('../ui/core/utils/screenshots');
import { autoUpdater } from "electron-updater";


function sendLog(message: string) {
  const windows = BrowserWindow.getAllWindows();

  for (const win of windows) {
    win.webContents.send("test-log", message);
  }
}

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
 * Allows renderer to call your Playwright runner and stream logs back.
 */
ipcMain.handle('run-test', async (event, options: RunOptions) => {
  const webContents = event.sender;
  return await runTest(options, (message: string) => {
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

/**
 * ----------------------------
 * IPC handler to clear screenshots
 * ----------------------------
 */
ipcMain.handle('clear-screenshots', () => {
  clearScreenshots((msg: string) => console.log(msg));
});


ipcMain.handle('get-screenshot-count', async () => {
  const dir = path.resolve('screenshots');

  try {
    if (!fs.existsSync(dir)) return 0;

    const files = fs.readdirSync(dir);
    return files.filter(f => f.endsWith('.png')).length;
  } catch {
    return 0;
  }
});

/**
 * ----------------------------
 * IPC handler: get app version
 * ----------------------------
 * Lets renderer display current app version
 */
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
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
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8"));
});

/**
 * ----------------------------
 * Create the main window
 * ----------------------------
 */
function createWindow() {
  const win = new BrowserWindow({
    minWidth: 900,
    minHeight: 860,
    icon: path.join(app.getAppPath(), 'assets/icon_256x256.png'),
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

  // Optional: open DevTools for debugging
  // win.webContents.openDevTools();
  return win;
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
    const zoomOutMultiplier = 1;
    window.webContents.setZoomFactor(zoomOutMultiplier / scale);
  });
});

/**
 * ----------------------------
 * App lifecycle
 * ----------------------------
 */
app.whenReady().then(() => {
  const win = createWindow();

  win.once("ready-to-show", () => {
    win.show();

    const scale = screen.getDisplayMatching(win.getBounds()).scaleFactor;
    win.webContents.setZoomFactor(1 / scale);

    win.setBounds(win.getBounds());

    autoUpdater.checkForUpdatesAndNotify();
  });

});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

autoUpdater.on("checking-for-update", () => {
  sendLog("Checking for updates...");
});

autoUpdater.on("update-available", () => {
  sendLog("Update available");
});

autoUpdater.on("update-not-available", () => {
  sendLog("No updates available");
});

autoUpdater.on("error", (err) => {
  sendLog(`Update error: ${err.message}`);
});

autoUpdater.on("update-downloaded", () => {
  sendLog("Update downloaded. Installing...");
  autoUpdater.quitAndInstall();
});