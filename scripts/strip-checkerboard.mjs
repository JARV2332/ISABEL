/**
 * Convierte PNG con fondo tipo tablero (cuadros gris/blanco) a PNG con alpha real.
 * Uso: node scripts/strip-checkerboard.mjs [carpeta-origen] [carpeta-destino]
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const srcDir = process.argv[2] ?? path.join("C:", "Users", "David", "Downloads", "ABC");
const outDir =
  process.argv[3] ?? path.join("public", "signs", "lsm", "letters");

fs.mkdirSync(outDir, { recursive: true });

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function saturation(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

function colorDistance(r, g, b, ref) {
  return Math.sqrt(
    (r - ref[0]) ** 2 + (g - ref[1]) ** 2 + (b - ref[2]) ** 2
  );
}

function sampleBackgroundColors(data, width, height, channels) {
  const samples = [];

  function px(x, y) {
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  }

  const margin = Math.min(24, Math.floor(width / 8), Math.floor(height / 8));
  for (let y = 0; y < margin; y++) {
    for (let x = 0; x < width; x++) {
      samples.push(px(x, y));
      samples.push(px(x, height - 1 - y));
    }
  }
  for (let y = margin; y < height - margin; y++) {
    for (let x = 0; x < margin; x++) {
      samples.push(px(x, y));
      samples.push(px(width - 1 - x, y));
    }
  }

  const neutrals = samples.filter(([r, g, b]) => {
    const sat = saturation(r, g, b);
    const lum = luminance(r, g, b);
    return sat < 0.12 && lum > 140;
  });

  const buckets = new Map();
  for (const [r, g, b] of neutrals) {
    const key = `${Math.round(r / 8) * 8},${Math.round(g / 8) * 8},${Math.round(b / 8) * 8}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  const bgColors = sorted.slice(0, 2).map(([key]) => key.split(",").map(Number));

  if (bgColors.length === 0) {
    bgColors.push([255, 255, 255], [204, 204, 204]);
  } else if (bgColors.length === 1) {
    const [r, g, b] = bgColors[0];
    bgColors.push([
      Math.max(0, r - 40),
      Math.max(0, g - 40),
      Math.max(0, b - 40),
    ]);
  }

  return bgColors;
}

function isBackgroundPixel(r, g, b, bgColors) {
  const sat = saturation(r, g, b);
  const lum = luminance(r, g, b);

  if (sat > 0.18 && lum < 245) return false;

  for (const ref of bgColors) {
    if (colorDistance(r, g, b, ref) <= 28) return true;
  }

  if (sat < 0.08 && lum > 195) return true;

  return false;
}

async function processImage(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const bgColors = sampleBackgroundColors(data, width, height, channels);
  const out = Buffer.from(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];

      if (isBackgroundPixel(r, g, b, bgColors)) {
        out[i + 3] = 0;
      }
    }
  }

  await sharp(out, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);
}

const files = fs
  .readdirSync(srcDir)
  .filter((f) => f.toLowerCase().endsWith(".png"))
  .sort();

for (const file of files) {
  const letter = path.basename(file, path.extname(file)).toLowerCase();
  const outPath = path.join(outDir, `${letter}.png`);
  await processImage(path.join(srcDir, file), outPath);
  console.log(`✓ ${file} → ${outPath}`);
}

console.log(`\nProcesadas ${files.length} imágenes con fondo transparente.`);
