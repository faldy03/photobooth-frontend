const { contextBridge, ipcRenderer } = require('electron');

// Ekspos API electron secara aman ke dalam window objek Next.js
contextBridge.exposeInMainWorld('electron', {
  printPhoto: (base64) => ipcRenderer.send('print-photo', base64),
  onPhotoReceived: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('dslr-photo-received', subscription);
    return () => ipcRenderer.removeListener('dslr-photo-received', subscription);
  }
});
