const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const server = http.createServer((req, res) => {
  // CORS Headers untuk menerima request dari Kios
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. OTOMATISASI CAPTURE / SHUTTER KAMERA (EOS UTILITY)
  if (req.url === '/capture' && req.method === 'POST') {
    console.log('[KIOS AGENT] Triggering Shutter Kamera Canon via EOS Utility...');
    
    // Perintah PowerShell untuk mengaktifkan jendela EOS Utility & menekan tombol Spacebar (Bintang Shutter)
    const command = `powershell -Command "$w = New-Object -ComObject WScript.Shell; $w.AppActivate('EOS R100'); $w.AppActivate('EOS Utility'); $w.SendKeys(' ')"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('[KIOS AGENT] Gagal memicu shutter:', error.message);
      } else {
        console.log('[KIOS AGENT] Shutter berhasil dipicu!');
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Capture triggered' }));
    return;
  }

  // 2. MENERIMA PERINTAH PRINT DNP PRINTER
  if (req.url === '/print' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      console.log('[KIOS AGENT] Menerima perintah cetak...');
      try {
        const data = JSON.parse(body);
        if (data.final_photo_base64) {
          const tempPath = path.join(__dirname, 'temp_print.jpg');
          const buffer = Buffer.from(data.final_photo_base64, 'base64');
          fs.writeFileSync(tempPath, buffer);

          // Perintah cetak gambar otomatis via Windows Shell
          const printCmd = `powershell -Command "Start-Process -FilePath '${tempPath}' -Verb Print"`;
          exec(printCmd, (err) => {
            if (err) console.error('[KIOS AGENT] Error printing:', err);
            else console.log('[KIOS AGENT] Foto dikirim ke printer DNP!');
          });
        }
      } catch (e) {
        console.error('[KIOS AGENT] Error parse print payload:', e);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Print payload received' }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`==================================================`);
  console.log(`  KIOS AGENT BERJALAN DI PORT ${PORT}`);
  console.log(`  Auto-Trigger Kamera & Print DNP Siap Digunakan!`);
  console.log(`==================================================`);
});
