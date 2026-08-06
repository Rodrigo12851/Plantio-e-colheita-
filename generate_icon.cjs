const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create the green IGARASHI logo SVG matching Image 2
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Green Squircle Background -->
  <rect width="512" height="512" rx="105" fill="#187a41"/>

  <!-- TRACTOR GRAPHIC (WHITE SILHOUETTE) -->
  <g fill="#ffffff">
    <!-- Cabin Roof -->
    <path d="M 132 128 C 132 120 140 114 150 114 L 270 114 C 285 114 294 122 298 135 L 305 160 L 132 160 Z"/>

    <!-- Cabin Pillars & Back -->
    <path d="M 132 152 L 152 152 L 152 230 L 132 230 Z"/>
    <path d="M 194 152 L 210 152 L 210 230 L 194 230 Z"/>
    <path d="M 270 152 L 290 152 L 275 230 L 255 230 Z"/>

    <!-- Front Hood & Body -->
    <path d="M 270 178 L 380 188 C 392 189 400 198 400 210 L 400 255 L 250 255 L 250 178 Z"/>

    <!-- Exhaust Pipe -->
    <path d="M 295 125 C 295 120 300 115 306 115 C 312 115 317 120 317 125 L 314 180 L 298 180 Z"/>

    <!-- Hood Grill Vents -->
    <rect x="345" y="200" width="8" height="20" rx="4" transform="rotate(15 349 210)" fill="#187a41"/>
    <rect x="360" y="202" width="8" height="20" rx="4" transform="rotate(15 364 212)" fill="#187a41"/>

    <!-- Rear Fender (Arched over big wheel) -->
    <path d="M 108 240 C 108 185 152 142 210 142 C 220 142 230 144 240 148 L 240 172 C 232 168 222 166 210 166 C 168 166 134 198 132 240 Z"/>
  </g>

  <!-- REAR WHEEL (BIG TIRE) -->
  <circle cx="180" cy="240" r="82" fill="none" stroke="#ffffff" stroke-width="26"/>
  <circle cx="180" cy="240" r="34" fill="none" stroke="#ffffff" stroke-width="14"/>

  <!-- FRONT WHEEL (SMALL TIRE) -->
  <circle cx="375" cy="255" r="52" fill="none" stroke="#ffffff" stroke-width="20"/>
  <circle cx="375" cy="255" r="20" fill="none" stroke="#ffffff" stroke-width="12"/>

  <!-- EMBLEM (JAPANESE MON FLOWER INSIDE CIRCLE) -->
  <g transform="translate(256, 362)">
    <!-- Outer Circle -->
    <circle cx="0" cy="0" r="58" fill="none" stroke="#ffffff" stroke-width="8"/>
    
    <!-- 4 Petals Mon Motif -->
    <g fill="#ffffff">
      <!-- Top Petal Lobe -->
      <path d="M -22 -10 C -36 -26 -16 -45 0 -45 C 16 -45 36 -26 22 -10 C 12 -18 -12 -18 -22 -10 Z"/>
      <!-- Bottom Petal Lobe -->
      <path d="M -22 10 C -36 26 -16 45 0 45 C 16 45 36 26 22 10 C 12 18 -12 18 -22 10 Z"/>
      <!-- Left Petal Lobe -->
      <path d="M -10 -22 C -26 -36 -45 -16 -45 0 C -45 16 -26 36 -10 22 C -18 12 -18 -12 -10 -22 Z"/>
      <!-- Right Petal Lobe -->
      <path d="M 10 -22 C 26 -36 45 -16 45 0 C 45 16 26 36 10 22 C 18 12 18 -12 10 -22 Z"/>
      
      <!-- Center Flower -->
      <circle cx="0" cy="0" r="14" fill="#ffffff"/>
      <circle cx="0" cy="0" r="6" fill="#187a41"/>
      <!-- Small petal dots -->
      <circle cx="0" cy="-10" r="3" fill="#187a41"/>
      <circle cx="0" cy="10" r="3" fill="#187a41"/>
      <circle cx="-10" cy="0" r="3" fill="#187a41"/>
      <circle cx="10" cy="0" r="3" fill="#187a41"/>
    </g>
  </g>

  <!-- IGARASHI TEXT -->
  <text x="256" y="462" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="52" letter-spacing="4">IGARASHI</text>
</svg>`;

async function run() {
  const publicDir = path.join(__dirname, 'public');
  
  // Save SVGs
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable-192.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.svg'), svgContent);

  const buffer = Buffer.from(svgContent);

  // Render PNGs
  await sharp(buffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(buffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(buffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-maskable-192.png'));
  await sharp(buffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));
  await sharp(buffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Icons generated successfully!');
}

run().catch(console.error);
