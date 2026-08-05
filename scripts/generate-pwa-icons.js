import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Check for generated image
const inputImagePath = path.resolve('src/assets/images/app_icon_logo_1785970398777.jpg');

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="110" fill="#0078d4"/>
  <circle cx="256" cy="256" r="210" fill="#005a9e" opacity="0.3"/>
  <path d="M 170 360 C 170 240, 240 180, 350 160 C 350 280, 280 340, 170 360 Z" fill="#107c41"/>
  <path d="M 210 360 C 210 270, 260 220, 350 200 C 350 290, 300 340, 210 360 Z" fill="#27ac60"/>
  <path d="M 256 120 C 256 120, 220 180, 256 240 C 292 180, 256 120, 256 120 Z" fill="#ffb900"/>
  <path d="M 180 180 C 180 180, 170 230, 210 270 C 230 230, 180 180, 180 180 Z" fill="#f3c200"/>
  <path d="M 332 180 C 332 180, 342 230, 302 270 C 282 230, 332 180, 332 180 Z" fill="#f3c200"/>
  <path d="M 256 220 L 256 380" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);

async function generateIcons() {
  console.log('Generating PWA Icons...');
  const baseInput = fs.existsSync(inputImagePath) ? inputImagePath : Buffer.from(svgIcon);

  // 1. icon-192.png
  await sharp(baseInput)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 2. icon-512.png
  await sharp(baseInput)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // 3. apple-touch-icon.png (180x180)
  await sharp(baseInput)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 4. Maskable icons (with 10% padding for safe area)
  await sharp(baseInput)
    .resize(153, 153, { fit: 'cover' })
    .extend({
      top: 19,
      bottom: 20,
      left: 19,
      right: 20,
      background: '#0078d4'
    })
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));

  await sharp(baseInput)
    .resize(410, 410, { fit: 'cover' })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#0078d4'
    })
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));

  // 5. Favicon 32x32
  await sharp(baseInput)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  console.log('PWA icons successfully created in public directory!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
