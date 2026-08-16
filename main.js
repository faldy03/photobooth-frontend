const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: !isDev, // Layar penuh otomatis jika build produksi
    autoHideMenuBar: true, // Sembunyikan menu bar standar browser
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // PENTING: Matikan keamanan web untuk akses langsung ke camera localhost:5513
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Jika development, load localhost Next.js dev server. Jika production, load URL hosting.
  const startUrl = isDev ? 'http://localhost:3000' : 'https://app.boothflow.site';
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// =========================================================================
// HANDLER PENCETAKAN DIRECT KE HOT FOLDER PRINTER DNP
// =========================================================================
ipcMain.on('print-photo', (event, base64Data) => {
  try {
    console.log('[ELECTRON] Menerima data cetak dari frontend...');
    
    if (!base64Data) {
      console.error('[ELECTRON] Error: Tidak ada data gambar untuk dicetak.');
      return;
    }

    // 1. Bersihkan prefix Base64
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    
    // 2. Ubah base64 string menjadi buffer biner
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    // 3. Folder target Hot Folder DNP
    const DNP_FOLDER = 'C:\\DNP\\HotFolderPrint\\Prints\\s6x2_2';

    // Buat folder jika belum ada
    if (!fs.existsSync(DNP_FOLDER)) {
      fs.mkdirSync(DNP_FOLDER, { recursive: true });
      console.log(`[ELECTRON] Folder DNP berhasil dibuat: ${DNP_FOLDER}`);
    }

    // 4. Buat nama file unik dan simpan
    const fileName = `print_${Date.now()}.jpg`;
    const filePath = path.join(DNP_FOLDER, fileName);

    fs.writeFileSync(filePath, buffer);
    console.log(`[ELECTRON SUCCESS] Foto berhasil dikirim ke printer: ${filePath}`);

  } catch (error) {
    console.error('[ELECTRON ERROR] Gagal mencetak foto:', error);
  }
});

app.whenReady().then(() => {
  // Autorisasi otomatis untuk akses webcam/kamera di dalam Electron
  const { session } = require('electron');
  
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      return callback(true); // Izinkan akses kamera/webcam
    }
    callback(false);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    if (permission === 'media') {
      return true; // Izinkan pemeriksaan status kamera
    }
    return false;
  });

  // Jalankan pemantau folder foto otomatis di background
  startFolderWatcher();

  // Jalankan server agent lokal otomatis di background (Port 3001)
  startLocalAgentServer();

  createWindow();
});

// =========================================================================
// FITUR AGENT LOKAL (PORT 3001): SHUTTER KAMERA & PRINTER DNP
// =========================================================================
const http = require('http');
const { exec } = require('child_process');

function startLocalAgentServer() {
  try {
    const agentServer = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url === '/capture' && req.method === 'POST') {
        console.log('[ELECTRON AGENT] Triggering Shutter Kamera Canon via EOS Utility...');
        const command = `powershell -Command "$w = New-Object -ComObject WScript.Shell; $w.AppActivate('EOS R100'); $w.AppActivate('EOS Utility'); $w.SendKeys(' ')"`;
        exec(command, (error) => {
          if (error) console.error('[ELECTRON AGENT] Shutter error:', error.message);
          else console.log('[ELECTRON AGENT] Shutter triggered!');
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    });

    agentServer.listen(3001, '127.0.0.1', () => {
      console.log('[ELECTRON AGENT] Server Agent Lokal berjalan otomatis di port 3001');
    });
  } catch (err) {
    console.error('[ELECTRON AGENT] Gagal memulai agent server:', err.message);
  }
}

// =========================================================================
// FITUR SINKRONISASI OTOMATIS: DETEKSI FOTO LOKAL -> UPLOAD KE CLOUD
// =========================================================================
const watchedFiles = new Set();

function startFolderWatcher() {
  const paths = [
    'C:\\PhotoboothPhotos',
    'C:\\laragon\\www\\photobooth-backend\\public\\raw_photos',
    'C:\\xampp\\htdocs\\photobooth\\photobooth-backend\\public\\raw_photos'
  ];

  // Pastikan folder universal C:\PhotoboothPhotos selalu dibuat jika belum ada
  paths.forEach(dir => {
    try {
      if (!fs.existsSync(dir) && dir === 'C:\\PhotoboothPhotos') {
        fs.mkdirSync(dir, { recursive: true });
        console.log('[WATCHER] Folder universal berhasil dibuat:', dir);
      }
    } catch (e) {
      console.error('[WATCHER] Gagal membuat folder:', dir, e.message);
    }
  });

  // Daftarkan file yang sudah ada agar tidak di-upload ulang pada saat startup
  paths.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          watchedFiles.add(path.join(dir, file));
        });
      }
    } catch (e) {
      console.error('[WATCHER] Gagal menginisialisasi folder:', dir, e.message);
    }
  });

  console.log('[WATCHER] Memulai pemantauan folder foto DSLR lokal...');

  const notifyFrontendOfNewPhoto = (fullPath, file) => {
    try {
      const fileBuffer = fs.readFileSync(fullPath);
      const base64Url = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('dslr-photo-received', {
          filename: file,
          url: base64Url
        });
        console.log('[WATCHER IPC INSTANT] Foto dikirim ke frontend secara instan:', file);
      }
    } catch (e) {
      console.error('[WATCHER IPC ERROR] Gagal membaca foto instan:', e.message);
    }
  };

  // 1. NATIVE OS WATCHER (0ms Delay via OS Event)
  paths.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        fs.watch(dir, (eventType, filename) => {
          if (!filename) return;
          const lower = filename.toLowerCase();
          if (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg')) return;
          if (filename === 'photo_1784298780_XFWUa.jpg' || filename === 'photo_1784298962_T7EhQ.jpg') return;

          const fullPath = path.join(dir, filename);
          if (!watchedFiles.has(fullPath)) {
            watchedFiles.add(fullPath);
            setTimeout(() => {
              notifyFrontendOfNewPhoto(fullPath, filename);
              uploadPhotoToCloud(fullPath, filename);
            }, 100);
          }
        });
      }
    } catch (e) {
      console.warn('[WATCHER] fs.watch warning:', e.message);
    }
  });

  // 2. HIGH-SPEED POLLING BACKUP (100ms)
  setInterval(() => {
    paths.forEach(dir => {
      try {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (!file.toLowerCase().endsWith('.jpg') && !file.toLowerCase().endsWith('.jpeg')) return;
          if (file === 'photo_1784298780_XFWUa.jpg' || file === 'photo_1784298962_T7EhQ.jpg') return;

          const fullPath = path.join(dir, file);
          if (!watchedFiles.has(fullPath)) {
            watchedFiles.add(fullPath);
            console.log('[WATCHER] Mendeteksi foto DSLR baru:', file);
            
            setTimeout(() => {
              notifyFrontendOfNewPhoto(fullPath, file);
              uploadPhotoToCloud(fullPath, file);
            }, 100);
          }
        });
      } catch (err) {}
    });
  }, 100); // High-speed 100ms polling
}

async function uploadPhotoToCloud(filePath, filename) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    // Gunakan FormData bawaan Node.js
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    formData.append('photo', blob, filename);

    console.log('[WATCHER] Mengunggah foto ke server:', filename);

    // 1. Upload ke Cloud Server
    fetch('https://boothflow.site/api/kiosk/receive-dslr-photo', {
      method: 'POST',
      body: formData
    }).then(r => r.json()).then(data => {
      if (data.success) console.log('[WATCHER SUCCESS CLOUD] Foto tersimpan di cloud:', data.filename);
    }).catch(() => {});

    // 2. Upload ke Laragon Backend Lokal (Port 8000 / Localhost)
    const formDataLocal = new FormData();
    const blobLocal = new Blob([fileBuffer], { type: 'image/jpeg' });
    formDataLocal.append('photo', blobLocal, filename);

    fetch('http://localhost:8000/api/kiosk/receive-dslr-photo', {
      method: 'POST',
      body: formDataLocal
    }).then(r => r.json()).then(data => {
      if (data.success) console.log('[WATCHER SUCCESS LOKAL] Foto tersimpan di Laragon:', data.filename);
    }).catch(() => {});

  } catch (err) {
    console.error('[WATCHER ERROR] Gagal mengirim file:', err.message);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
