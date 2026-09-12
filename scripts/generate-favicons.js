const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createIco(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(count, 4); // count

  const entries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([
    header,
    ...entries,
    ...pngBuffers.map(p => p.buffer)
  ]);
}

async function main() {
  const sourceAvif = path.join(__dirname, '../public/logo-kunjungan-pegawai.avif');
  console.log('Source:', sourceAvif);

  // 1. Generate PNGs in different sizes
  const [b16, b32, b48, b180, b192, b512] = await Promise.all([
    sharp(sourceAvif).resize(16, 16).png().toBuffer(),
    sharp(sourceAvif).resize(32, 32).png().toBuffer(),
    sharp(sourceAvif).resize(48, 48).png().toBuffer(),
    sharp(sourceAvif).resize(180, 180).png().toBuffer(),
    sharp(sourceAvif).resize(192, 192).png().toBuffer(),
    sharp(sourceAvif).resize(512, 512).png().toBuffer(),
  ]);

  // 2. Build multi-resolution ICO file
  const icoBuffer = await createIco([
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
  ]);

  // 3. Write files
  // app/favicon.ico
  fs.writeFileSync(path.join(__dirname, '../app/favicon.ico'), icoBuffer);
  // public/favicon.ico
  fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), icoBuffer);

  // app/icon.png (Next.js auto-detects this as favicon/tab icon!)
  fs.writeFileSync(path.join(__dirname, '../app/icon.png'), b32);
  fs.writeFileSync(path.join(__dirname, '../public/icon.png'), b32);

  // app/apple-icon.png (Next.js auto-detects this as apple-touch-icon!)
  fs.writeFileSync(path.join(__dirname, '../app/apple-icon.png'), b180);
  fs.writeFileSync(path.join(__dirname, '../public/apple-icon.png'), b180);

  // High-res png
  fs.writeFileSync(path.join(__dirname, '../public/logo-kunjungan-pegawai.png'), b512);

  // Remove app/icon.avif if exists so it doesn't conflict with app/icon.png
  const appIconAvif = path.join(__dirname, '../app/icon.avif');
  if (fs.existsSync(appIconAvif)) {
    fs.unlinkSync(appIconAvif);
  }

  console.log('Favicons and tab icons generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
