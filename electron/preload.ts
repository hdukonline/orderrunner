import { contextBridge, ipcRenderer } from 'electron';
import type { RunOptions } from '../playwright/runner.js';

// Expose a safe API to the renderer process (bridge)
// forwarding calls to the main process and streaming logs back.
contextBridge.exposeInMainWorld('api', {

  /* -------------------------------------------------------------- */
  /* RUNNER IPC                                                     */
  /* -------------------------------------------------------------- */

  // One-shot call to start the test
  runTest: (options: RunOptions) => ipcRenderer.invoke('run-test', options),

  // Listener for streaming log messages from the test
  onTestLog: (callback: (message: string) => void) => {
    ipcRenderer.on('test-log', (_, message: string) => callback(message));
  },


  /* -------------------------------------------------------------- */
  /* ENVIRONMENT STORAGE IPC                                        */
  /* -------------------------------------------------------------- */
  // Save environments.json
  saveEnvironments: (envs: any[]) => ipcRenderer.invoke('env-save', envs),
  // Load environments.json
  loadEnvironments: () => ipcRenderer.invoke('env-load'),

  openFile: (path: string) => ipcRenderer.invoke("open-file", path),

  clearScreenshots: () => ipcRenderer.invoke('clear-screenshots'),

  getScreenshotCount: () => ipcRenderer.invoke('get-screenshot-count'),

  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
});