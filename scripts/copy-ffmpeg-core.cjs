// scripts/copy-ffmpeg-core.cjs
const fs = require('fs');
const path = require('path');

// Source: node_modules/@ffmpeg/core/dist/esm/
const srcDir = path.join(__dirname, '..', 'node_modules', '@ffmpeg', 'core', 'dist', 'esm');
const destDir = path.join(__dirname, '..', 'public', 'ffmpeg');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm'];
files.forEach((file) => {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (!fs.existsSync(src)) {
    console.error(`Source file not found: ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied ${file}`);
});

console.log('FFmpeg core files are now in public/ffmpeg/');