// 의존성 없는 PNG 아이콘 생성기 (Node 내장 zlib만 사용).
// 행운로또 앱 아이콘: 다크 그라데이션 배경 + 골드 로또볼.
//   node scripts/gen-icons.mjs
import zlib from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.resolve(__dirname, "../public");

/* ── PNG 인코딩 ─────────────────────────────── */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // rows with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ── 그리기 헬퍼 ────────────────────────────── */
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

function drawIcon(size, { rounded, fullBleed, opaque }) {
  const buf = Buffer.alloc(size * size * 4);
  const bgA = hex("#1e1b4b"), bgB = hex("#0b1020"), bgC = hex("#062a30");
  const ballHi = hex("#fde68a"), ballMid = hex("#f59e0b"), ballLo = hex("#b45309");
  const cx = size / 2;
  const cy = size * (fullBleed ? 0.5 : 0.48);
  const r = size * (fullBleed ? 0.23 : 0.29);
  const radius = size * 0.22; // 라운드 코너 반경
  // 하이라이트 중심
  const hx = cx - r * 0.35, hy = cy - r * 0.4;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let alpha = 255;
      // 라운드 코너 (fullBleed가 아니면)
      if (rounded && !fullBleed) {
        const inX = Math.min(x, size - 1 - x);
        const inY = Math.min(y, size - 1 - y);
        if (inX < radius && inY < radius) {
          const dx = radius - inX, dy = radius - inY;
          if (dx * dx + dy * dy > radius * radius) alpha = 0;
        }
      }
      // 배경 (대각 그라데이션 + 하단 청록)
      const t = (x + y) / (2 * size);
      let col = t < 0.5 ? mix(bgA, bgB, t * 2) : mix(bgB, bgC, (t - 0.5) * 2);
      // 볼
      const dxb = x - cx, dyb = y - cy;
      const dist = Math.sqrt(dxb * dxb + dyb * dyb);
      if (dist <= r) {
        const hd = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2) / (r * 1.5);
        const tt = Math.min(1, hd);
        col = tt < 0.5 ? mix(ballHi, ballMid, tt * 2) : mix(ballMid, ballLo, (tt - 0.5) * 2);
        // 안티에일리어스 가장자리
        if (dist > r - 1.5) {
          const edge = (r - dist) / 1.5;
          const bgt = (x + y) / (2 * size);
          const bg = bgt < 0.5 ? mix(bgA, bgB, bgt * 2) : mix(bgB, bgC, (bgt - 0.5) * 2);
          col = mix(bg, col, Math.max(0, Math.min(1, edge)));
        }
        // 광택 점
        const sd = Math.sqrt((x - (cx - r * 0.32)) ** 2 + (y - (cy - r * 0.36)) ** 2);
        if (sd < r * 0.22) col = mix(col, [255, 255, 255], (1 - sd / (r * 0.22)) * 0.45);
      }
      buf[i] = Math.round(col[0]);
      buf[i + 1] = Math.round(col[1]);
      buf[i + 2] = Math.round(col[2]);
      buf[i + 3] = opaque ? 255 : alpha;
    }
  }
  return encodePNG(size, size, buf);
}

const targets = [
  { file: "icon-192.png", size: 192, opts: { rounded: true } },
  { file: "icon-512.png", size: 512, opts: { rounded: true } },
  { file: "icon-maskable-512.png", size: 512, opts: { fullBleed: true, opaque: true } },
  { file: "apple-touch-icon.png", size: 180, opts: { opaque: true } },
];
for (const t of targets) {
  const png = drawIcon(t.size, t.opts);
  writeFileSync(path.join(PUB, t.file), png);
  console.log(`✓ ${t.file} (${t.size}px, ${png.length} bytes)`);
}
