// scripts/serve-core.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const BASE = path.join(__dirname, '..', 'public', 'ffmpeg');

http.createServer((req, res) => {
  const fileName = req.url.split('?')[0];
  const filePath = path.join(BASE, fileName);

  // Security check
  if (!filePath.startsWith(BASE) || !fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end('Not found');
  }

  const ext = path.extname(filePath);
  const mime = ext === '.wasm' ? 'application/wasm' : 'application/javascript';

  // Required headers
  res.setHeader('Content-Type', mime);
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // 👈 THIS FIXES CORS

  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`✅ FFmpeg core server running on http://localhost:${PORT}`);
});