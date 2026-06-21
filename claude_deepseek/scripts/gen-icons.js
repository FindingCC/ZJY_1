const fs = require("fs");
const zlib = require("zlib");

function makePNG(width, height, r, g, b) {
  // Build raw pixel data (filter byte + RGBA per row)
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const off = y * rowSize + 1 + x * 4;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = 255;
    }
  }
  const deflated = zlib.deflateSync(raw);

  // CRC32 helper
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const t = Buffer.from(type, "ascii");
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crcVal]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflated), chunk("IEND", Buffer.alloc(0))]);
}

if (!fs.existsSync("public")) fs.mkdirSync("public");

fs.writeFileSync("public/icon-192.png", makePNG(192, 192, 29, 78, 216));
console.log("✓ public/icon-192.png");
fs.writeFileSync("public/icon-512.png", makePNG(512, 512, 29, 78, 216));
console.log("✓ public/icon-512.png");
