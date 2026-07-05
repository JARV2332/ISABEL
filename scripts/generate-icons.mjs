import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import sharp from "sharp";
import toIco from "to-ico";

const root = join(import.meta.dirname, "..");
const source = join(root, "public", "logo.png");
const appDir = join(root, "src", "app");
const publicDir = join(root, "public");

/** Recorta márgenes blancos y genera iconos cuadrados para pestañas. */
async function buildSquareIcon(size) {
  const trimmed = await sharp(source).trim({ threshold: 15 }).png().toBuffer();
  return sharp(trimmed)
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();
}

const icon512 = await buildSquareIcon(512);
const icon180 = await buildSquareIcon(180);
const icon32 = await buildSquareIcon(32);
const icon48 = await buildSquareIcon(48);

const targets = [
  [join(appDir, "icon.png"), icon512],
  [join(appDir, "apple-icon.png"), icon180],
  [join(publicDir, "logo-icon.png"), icon512],
  [join(publicDir, "apple-touch-icon.png"), icon180],
  [join(publicDir, "favicon-32.png"), icon32],
  [join(publicDir, "favicon-48.png"), icon48],
];

for (const [path, buffer] of targets) {
  writeFileSync(path, buffer);
}

writeFileSync(
  join(appDir, "favicon.ico"),
  await toIco([icon32, icon48, await buildSquareIcon(16)])
);

console.log("Iconos favicon generados (logo EDUKIDS recortado y cuadrado).");
