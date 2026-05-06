import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('api', {
    /* -------------------------------------------------------------- */
    /* RUNNER IPC                                                     */
    /* -------------------------------------------------------------- */
    // One-shot call to start the test
    runTest: (options) => ipcRenderer.invoke('run-test', options),
    // Listener for streaming log messages from the test
    onTestLog: (callback) => {
        ipcRenderer.on('test-log', (_, message) => callback(message));
    },
    /* -------------------------------------------------------------- */
    /* ENVIRONMENT STORAGE IPC                                        */
    /* -------------------------------------------------------------- */
    // Save environments.json
    saveEnvironments: (envs) => ipcRenderer.invoke('env-save', envs),
    // Load environments.json
    loadEnvironments: () => ipcRenderer.invoke('env-load'),
    openFile: (path) => ipcRenderer.invoke("open-file", path),
});
