import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectPhotos: () => ipcRenderer.invoke('select-photos'),
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string>;
      selectPhotos: () => Promise<string[]>;
    };
  }
}