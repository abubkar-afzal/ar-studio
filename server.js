// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Map file extension -> MIME type
const MIME = {
  '.wasm': 'application/wasm',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.css':  'text/css',
};

app.prepare().then(() => {
  createServer((req, res) => {
    // --- 1. Force cross-origin isolation on EVERY response ---
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    const parsedUrl = parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // --- 2. Special handling for /ffmpeg/ files ---
    if (pathname.startsWith('/ffmpeg/')) {
      const filePath = path.join(__dirname, 'public', pathname);
      const ext = path.extname(filePath);

      // Set correct MIME type
      if (MIME[ext]) {
        res.setHeader('Content-Type', MIME[ext]);
      }

      // If file exists, serve it directly (bypass Next.js)
      try {
        if (fs.existsSync(filePath)) {
          const stream = fs.createReadStream(filePath);
          stream.pipe(res);
          return;  // important: stop here
        }
      } catch (err) {
        console.error('Static file error:', err);
      }
    }

    // --- 3. Let Next.js handle everything else ---
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Server ready on http://localhost:3000');
  });
});