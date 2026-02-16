const fs = require('fs');
const path = require('path');
const { deflateSync } = require('zlib');

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

function crc32(buf) {
    let c = 0xFFFFFFFF;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let cr = n;
        for (let k = 0; k < 8; k++) {
            cr = (cr & 1) ? (0xEDB88320 ^ (cr >>> 1)) : (cr >>> 1);
        }
        table[n] = cr;
    }
    for (let i = 0; i < buf.length; i++) {
        c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData), 0);
    return Buffer.concat([len, typeData, crc]);
}

function createPNG(size) {
    const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8;
    ihdr[9] = 2; // RGB
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const rawData = [];
    const cx = size / 2;
    const cy = size / 2;

    for (let y = 0; y < size; y++) {
        rawData.push(0);
        for (let x = 0; x < size; x++) {
            const isArrow = (
                (Math.abs(y - cy) < size * 0.06 && x > size * 0.25 && x < size * 0.65) ||
                (x > size * 0.5 && x < size * 0.7 && Math.abs(y - cy + (x - size * 0.65) * 0.8) < size * 0.04) ||
                (x > size * 0.5 && x < size * 0.7 && Math.abs(y - cy - (x - size * 0.65) * 0.8) < size * 0.04) ||
                (Math.abs(x - size * 0.25) < size * 0.05 && y > size * 0.3 && y < size * 0.7)
            );

            if (isArrow) {
                rawData.push(255, 255, 255);
            } else {
                rawData.push(79, 70, 229);
            }
        }
    }

    const compressed = deflateSync(Buffer.from(rawData));

    return Buffer.concat([
        SIGNATURE,
        makeChunk('IHDR', ihdr),
        makeChunk('IDAT', compressed),
        makeChunk('IEND', Buffer.alloc(0)),
    ]);
}

for (const size of sizes) {
    const png = createPNG(size);
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), png);
    console.log(`Created ${size}x${size} icon`);
}
