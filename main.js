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

  createWindow();
});

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

  setInterval(() => {
    paths.forEach(dir => {
      try {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        files.forEach(file => {
          // Hanya proses file gambar JPG/JPEG
          if (!file.toLowerCase().endsWith('.jpg') && !file.toLowerCase().endsWith('.jpeg')) return;
          
          // Abaikan berkas master bawaan seeder
          if (file === 'photo_1784298780_XFWUa.jpg' || file === 'photo_1784298962_T7EhQ.jpg') return;

          const fullPath = path.join(dir, file);
          if (!watchedFiles.has(fullPath)) {
            watchedFiles.add(fullPath);
            console.log('[WATCHER] Mendeteksi foto DSLR baru:', file);
            
            // Tunggu 500ms agar digiCamControl selesai menulis file secara utuh sebelum dibaca
            setTimeout(() => {
              uploadPhotoToCloud(fullPath, file);
            }, 500);
          }
        });
      } catch (err) {
        // Abaikan error pembacaan sementara
      }
    });
  }, 1000); // Polling setiap 1 detik
}

async function uploadPhotoToCloud(filePath, filename) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    // Gunakan FormData bawaan Node.js
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    formData.append('photo', blob, filename);

    console.log('[WATCHER] Mengunggah foto ke cloud server:', filename);

    const response = await fetch('https://boothflow.site/api/kiosk/receive-dslr-photo', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (data.success) {
      console.log('[WATCHER SUCCESS] Foto berhasil disimpan di cloud database:', data.filename);
    } else {
      console.error('[WATCHER ERROR] Server menolak upload:', data.message);
    }
  } catch (err) {
    console.error('[WATCHER ERROR] Gagal mengirim file ke cloud:', err.message);
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
