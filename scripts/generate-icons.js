// Run: node scripts/generate-icons.js
// Requires: npm install canvas (or use an online SVG-to-PNG tool)
// This script generates simple placeholder icons for the PWA.
// For production, replace with proper branded icons.

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Airplane icon (simplified)
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✈', size / 2, size / 2);

  const outputPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
  console.log(`Generated ${outputPath}`);
}

try {
  generateIcon(192);
  generateIcon(512);
} catch (e) {
  console.log('Canvas not available. Please generate icons manually or install the canvas package.');
  console.log('You can use: https://realfavicongenerator.net/ to generate icons');
}
