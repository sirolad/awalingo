/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// Create simple PNG files with different sizes for PWA icons
// Since we don't have image processing libraries, I'll create basic placeholder PNGs

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a minimal 1x1 pixel PNG in base64
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createPNGData = size => {
  // This is a minimal PNG that will show as a blue square
  // In a real app, you'd use proper image conversion tools
  const header = Buffer.from([
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
    0x0d, // IHDR chunk size
    0x49,
    0x48,
    0x44,
    0x52, // IHDR
    0x00,
    0x00,
    0x00,
    0x01, // Width: 1
    0x00,
    0x00,
    0x00,
    0x01, // Height: 1
    0x08,
    0x02,
    0x00,
    0x00,
    0x00, // Bit depth, color type, compression, filter, interlace
    0x90,
    0x77,
    0x53,
    0xde, // CRC
    0x00,
    0x00,
    0x00,
    0x0c, // IDAT chunk size
    0x49,
    0x44,
    0x41,
    0x54, // IDAT
    0x08,
    0x99,
    0x01,
    0x01,
    0x00,
    0x00,
    0x00,
    0xff,
    0xff,
    0x00,
    0x00,
    0x00,
    0x02,
    0x00,
    0x01, // Compressed data
    0x00,
    0x00,
    0x00,
    0x00, // IEND chunk size
    0x49,
    0x45,
    0x4e,
    0x44, // IEND
    0xae,
    0x42,
    0x60,
    0x82, // CRC
  ]);

  return header;
};

const createPlaceholderIcon = size => {
  // Create a simple SVG as base64 data URL for now
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3B82F6"/>
        <stop offset="100%" style="stop-color:#1E40AF"/>
      </linearGradient>
    </defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#grad)"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2.5}" fill="white" opacity="0.9"/>
    <text x="${size / 2}" y="${size / 2 + size / 8}" font-family="Arial, sans-serif" font-size="${size / 4}" font-weight="bold" text-anchor="middle" fill="url(#grad)">A</text>
  </svg>`;

  return Buffer.from(svg);
};

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate PNG files for each size
sizes.forEach(size => {
  const iconData = createPlaceholderIcon(size);

  // For now, save as SVG (browsers can handle SVG in manifest)
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgFilepath = path.join(iconsDir, svgFilename);
  fs.writeFileSync(svgFilepath, iconData);

  console.log(`Created ${svgFilename}`);
});

console.log('Icon generation complete!');
console.log(
  'Note: For production, use proper image conversion tools to create actual PNG files.'
);
