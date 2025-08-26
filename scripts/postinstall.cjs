const { copyFileSync, mkdirSync } = require('fs');
const path = require('path');

const src = path.resolve('node_modules/occt-import-js/dist/occt-import-js.wasm');
const destDir = path.resolve('public/occt');
const dest = path.join(destDir, 'occt-import-js.wasm');

try {
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, dest);
  console.log('Copied', src, 'to', dest);
} catch (err) {
  console.error('Failed to copy occt-import-js.wasm:', err);
}
