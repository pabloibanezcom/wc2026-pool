const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

const tags = [
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<link rel="manifest" href="/manifest.json" />',
  '<link rel="apple-touch-icon" href="/icon-192.png" />',
].join('\n  ');

html = html.replace('</head>', `  ${tags}\n</head>`);
fs.writeFileSync(indexPath, html);
console.log('PWA tags injected into dist/index.html');
