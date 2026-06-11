const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  adjustZoom: (delta) => ipcRenderer.send('adjust-zoom', delta),
  resetZoom: () => ipcRenderer.send('reset-zoom'),
  getAssetPath: (...segments) => ipcRenderer.invoke('get-asset-path', ...segments),
  showPopupNotification: ({ type, title, message, playSound }) =>
    ipcRenderer.send('show-popup-notification', { type, title, message, playSound }),
  onNotificationDismissed: (callback) =>
    ipcRenderer.on('notification-dismissed', (event, type) => callback(type)),
  openExternal: (url) => ipcRenderer.send('open-external', url),
});
