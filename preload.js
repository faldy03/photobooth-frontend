const { contextBridge, ipcRenderer } = require('electron');

// Ekspos API electron secara aman ke dalam window objek Next.js
contextBridge.exposeInMainWorld('electron', {
  printPhoto: (base64) => ipcRenderer.send('print-photo', base64)
});
