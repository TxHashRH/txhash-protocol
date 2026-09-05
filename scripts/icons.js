/**
 * Derives the shipped icons from the supplied master.
 *
 * Nothing here is drawn or invented. The mark comes from the client's own
 * artwork and the ground it sits on is the colour sampled from their own
 * flattened lockup, so the icon reproduces how they already present the mark
 * rather than inventing a treatment for it.
 *
 * WHY IT IS COMPOSITED AND NOT SHIPPED WITH ALPHA. The mark is white-only. A
 * transparent white icon disappears against light browser chrome, which is
 * where a favicon spends half its life. Compositing onto the sampled ground is
 * the same pairing the client's own flattened file uses.
 *
 * THE DERIVATION, in order, because the order is what stops it fringing:
 *
 *   1. Knock out the invisible halo. Pixels at alpha <= 1 are not ink; they are
 *      an artefact of how the file was exported. Left in, they sit inside the
 *      bounding box and shrink the visible mark inside its own frame.
 *   2. Trim to the ink. Bounding box of everything that survived the knockout.
 *   3. Pad to a square, so the mark is not distorted and not flush to an edge.
 *   4. Composite onto the ground. After this every pixel is opaque, which is
 *      what makes step 5 safe: resampling straight colour with alpha still
 *      attached is what pulls dark fringes out of antialiased edges, and there
 *      is no alpha left to mishandle.
 *   5. Area-average down to the target size. A box filter over every source
 *      pixel that lands in a destination pixel, not a nearest-neighbour pick.
 *      At these ratios -- roughly 50:1 -- dropping samples is what turns a
 *      finely antialiased mark into noise.
 *
 * The alpha ceiling in this master is 254, not 255: 84 of its 4,000,000 pixels
 * are fully opaque and they are a fringe artefact. Nothing here keys on 255.
 *
 * Output is written with IHDR, IDAT and IEND only, so the shipped files carry
 * no metadata by construction rather than by a stripping pass afterwards. The
 * image-metadata gate reads the chunk table back out of the emitted bytes and
 * fails if anything else appears.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SOURCES } from '../src/config/palette.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

export const MASTER = resolve(ROOT, 'brand/LOGO TXHASH PNG...png');
export const OUT_DIR = resolve(ROOT, 'public');

/** Sizes to emit. Resampled here rather than left to the browser to shrink. */
export const SIZES = [32, 16];
export const outFor = (size) => resolve(OUT_DIR, `icon-${size}.png`);

/* ------------------------------------------------------------------ decode */

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

export function decodePng(file) {
  const buf = readFileSync(file);
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error(`${file} is not a png`);

  let i = 8;
  let w = 0;
  let h = 0;
  let depth = 0;
  let ctype = 0;
  const idat = [];

  while (i + 8 <= buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.toString('latin1', i + 4, i + 8);
    const data = buf.subarray(i + 8, i + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      depth = data[8];
      ctype = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    i += 12 + len;
  }

  if (depth !== 8 || (ctype !== 6 && ctype !== 2)) {
    throw new Error(`unsupported png: bit depth ${depth}, colourtype ${ctype}`);
  }

  const bpp = ctype === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = Buffer.alloc(h * stride);

  let pos = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const out = px.subarray(y * stride, (y + 1) * stride);
    const prev = y ? px.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) v += paeth(a, b, c);
      out[x] = v & 0xff;
    }
  }

  return { px, w, h, bpp };
}

/* ------------------------------------------------------------------ encode */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/**
 * Encodes opaque RGB as a truecolour PNG carrying IHDR, IDAT and IEND and
 * nothing else. No text chunk, no timestamp, no gamma, no physical dimensions:
 * a file that never had metadata cannot leak it.
 */
export function encodePng(rgb, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colourtype: truecolour, no alpha
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const stride = w * 3;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter type none
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------- derivation */

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Alpha at or below this is an export artefact, not ink. */
export const HALO_ALPHA = 1;

export function derive(size) {
  const { px, w, h, bpp } = decodePng(MASTER);
  if (bpp !== 4) throw new Error('master has no alpha channel; cannot knock out or trim');

  const alphaAt = (x, y) => px[(y * w + x) * bpp + 3];

  /* 1 + 2: knock out the halo, then trim to what survived. */
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  let knocked = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = alphaAt(x, y);
      if (a <= HALO_ALPHA) {
        if (a > 0) knocked++;
        continue;
      }
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error('master is empty after the knockout');

  const inkW = maxX - minX + 1;
  const inkH = maxY - minY + 1;

  /* 3: square it, and inset the mark so it is not flush to the edge. A favicon
     is read at 16px inside browser chrome that supplies no margin of its own. */
  const inset = 0.125;
  const side = Math.round(Math.max(inkW, inkH) * (1 + inset * 2));
  const offX = Math.round((side - inkW) / 2);
  const offY = Math.round((side - inkH) / 2);

  /* 4: composite onto the sampled ground. The ground comes from the palette's
     provenance record, so this file names no colour of its own. */
  const ground = hexToRgb(SOURCES.ground.hex);
  const flat = Buffer.alloc(side * side * 3);
  for (let i = 0; i < side * side; i++) {
    flat[i * 3] = ground[0];
    flat[i * 3 + 1] = ground[1];
    flat[i * 3 + 2] = ground[2];
  }
  for (let y = 0; y < inkH; y++) {
    for (let x = 0; x < inkW; x++) {
      const s = ((minY + y) * w + (minX + x)) * bpp;
      const a = px[s + 3] / 255;
      if (a === 0) continue;
      const d = ((offY + y) * side + (offX + x)) * 3;
      for (let c = 0; c < 3; c++) flat[d + c] = Math.round(px[s + c] * a + flat[d + c] * (1 - a));
    }
  }

  /* 5: area average. Every source pixel contributes to exactly one destination
     pixel, weighted by nothing more than how many land there. */
  const out = Buffer.alloc(size * size * 3);
  const scale = side / size;
  for (let dy = 0; dy < size; dy++) {
    const y0 = Math.floor(dy * scale);
    const y1 = Math.min(side, Math.max(y0 + 1, Math.floor((dy + 1) * scale)));
    for (let dx = 0; dx < size; dx++) {
      const x0 = Math.floor(dx * scale);
      const x1 = Math.min(side, Math.max(x0 + 1, Math.floor((dx + 1) * scale)));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const s = (y * side + x) * 3;
          r += flat[s];
          g += flat[s + 1];
          b += flat[s + 2];
          n++;
        }
      }
      const d = (dy * size + dx) * 3;
      out[d] = Math.round(r / n);
      out[d + 1] = Math.round(g / n);
      out[d + 2] = Math.round(b / n);
    }
  }

  return { bytes: encodePng(out, size, size), meta: { w, h, inkW, inkH, side, knocked, minX, minY } };
}

const runDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (runDirectly) {
  if (!existsSync(MASTER)) {
    /* The artwork is deliberately not in the repository, so a clone will not
       have it. Regenerating is then impossible and the already-derived files in
       public/ are what ships; saying so beats failing a build for a file that
       was never meant to be committed. */
    const missing = SIZES.filter((s) => !existsSync(outFor(s)));
    if (missing.length) {
      process.stderr.write(`master artwork not present and icon-${missing.join(', icon-')}.png missing\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write('master artwork not present; keeping the icons already in public/\n');
    }
  } else {
    mkdirSync(OUT_DIR, { recursive: true });
    for (const size of SIZES) {
      const { bytes, meta } = derive(size);
      writeFileSync(outFor(size), bytes);
      process.stdout.write(
        `wrote icon-${size}.png  ${bytes.length} bytes  ` +
          `ink ${meta.inkW}x${meta.inkH} from ${meta.w}x${meta.h} at (${meta.minX},${meta.minY}), ` +
          `squared to ${meta.side}, ${meta.knocked} halo px knocked out\n`
      );
    }
  }
}
