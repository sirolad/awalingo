/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// Simple PNG creator - creates a basic blue circle with white N
// This is a minimal PNG implementation for the PWA icons

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createMinimalPNG = size => {
  // This creates a simple 1x1 blue pixel PNG
  // In production, you'd use proper image libraries like sharp or canvas
  const pngData = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d, // IHDR length
    0x49,
    0x48,
    0x44,
    0x52, // "IHDR"
    0x00,
    0x00,
    0x00,
    size >> 8,
    size & 0xff, // width (16-bit big endian)
    0x00,
    0x00,
    0x00,
    size >> 8,
    size & 0xff, // height (16-bit big endian)
    0x08,
    0x02,
    0x00,
    0x00,
    0x00, // bit depth=8, color type=2 (RGB), compression=0, filter=0, interlace=0
    0x4e,
    0x08,
    0x64,
    0x82, // CRC for IHDR

    // Simplified IDAT chunk with blue color
    0x00,
    0x00,
    0x00,
    0x09, // IDAT length
    0x49,
    0x44,
    0x41,
    0x54, // "IDAT"
    0x08,
    0x1d,
    0x01,
    0x04,
    0x00,
    0xfb,
    0xff,
    0x3b,
    0x82, // compressed data (blue pixel)

    0x00,
    0x00,
    0x00,
    0x00, // IEND length
    0x49,
    0x45,
    0x4e,
    0x44, // "IEND"
    0xae,
    0x42,
    0x60,
    0x82, // IEND CRC
  ]);

  return pngData;
};

// Create a better approach - copy an existing simple PNG and rename it
const createIconFile = size => {
  // For now, create a simple text file that can be served as PNG
  // This is just to make the PWA work - in production use proper image tools

  const simpleIcon = `
  <!-- This is a placeholder. In production, replace with actual ${size}x${size} PNG -->
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="#3B82F6"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="white"/>
    <text x="${size / 2}" y="${size / 2 + size / 12}" font-family="Arial" font-size="${size / 5}" font-weight="bold" text-anchor="middle" fill="#3B82F6">A</text>
  </svg>`;

  return Buffer.from(simpleIcon);
};

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

sizes.forEach(size => {
  const iconData = createIconFile(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);

  fs.writeFileSync(filepath, iconData);
  console.log(`Created ${filename} (${size}x${size})`);
});

console.log('\nIcon creation complete!');
console.log(
  'Note: These are placeholder files. For production, use proper image tools like:'
);
console.log('- ImageMagick: convert icon.svg -resize 192x192 icon-192x192.png');
console.log(
  '- Sharp (Node.js): sharp(svgBuffer).resize(192).png().toFile("icon-192x192.png")'
);
console.log('- Online tools: realfavicongenerator.net');
