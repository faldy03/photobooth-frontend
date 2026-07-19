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

  createWindow();
});

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
