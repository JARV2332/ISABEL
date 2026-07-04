/**
 * Recorta el abecedario LSM (imagen en grid) en PNG por letra.
 * Uso: node scripts/split-lsm-alphabet.mjs [ruta-imagen]
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const DEFAULT_SOURCE = path.join(
  "scripts",
  "assets",
  "lsm-alphabet-source.png"
);
const OUT_DIR = path.join("public", "signs", "lsm", "letters");

/** Grid 6 columnas × 5 filas; fila 5 solo usa columnas 1–3 (centradas) */
const ROWS = [
  ["a", "b", "c", "d", "e", "f"],
  ["g", "h", "i", "j", "k", "l"],
  ["m", "n", "ñ", "o", "p", "q"],
  ["r", "s", "t", "u", "v", "w"],
  [
    { letter: "x", col: 0 },
    { letter: "y", col: 1 },
    { letter: "z", col: 2 },
  ],
];

/** Coordenadas calibradas para la imagen 591×679 px */
const GRID = {
  left: 14,
  top: 10,
  colWidth: 94,
  rowHeight: 132,
  rowGap: 10,
  /** Recorte: mano + flechas de movimiento */
  cropPadX: 8,
  cropTop: 18,
  cropHeight: 100,
  /** Fila X-Y-Z: caja más baja, top manual */
  lastRowTop: 556,
};

function colLeft(colIndex, rowIndex, imageWidth) {
  if (rowIndex === ROWS.length - 1) {
    const threeColWidth = 3 * GRID.colWidth;
    const lastRowLeft = Math.round(((imageWidth - threeColWidth) / 2) + GRID.cropPadX);
    return lastRowLeft + colIndex * GRID.colWidth;
  }
  return GRID.left + colIndex * GRID.colWidth + GRID.cropPadX;
}

function rowTop(rowIndex) {
  if (rowIndex === ROWS.length - 1) return GRID.lastRowTop + GRID.cropTop;
  return GRID.top + rowIndex * (GRID.rowHeight + GRID.rowGap) + GRID.cropTop;
}

function cropWidth() {
  return GRID.colWidth - GRID.cropPadX * 2;
}

async function splitAlphabet(sourcePath) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`No se encontró la imagen: ${sourcePath}`);
  }

  const meta = await sharp(sourcePath).metadata();
  console.log(`Fuente: ${sourcePath} (${meta.width}×${meta.height})`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let count = 0;

  for (let rowIndex = 0; rowIndex < ROWS.length; rowIndex++) {
    const row = ROWS[rowIndex];

    for (const entry of row) {
      const letter = typeof entry === "string" ? entry : entry.letter;
      const colIndex = typeof entry === "string" ? row.indexOf(entry) : entry.col;

      const left = colLeft(colIndex, rowIndex, meta.width ?? 591);
      const top = rowTop(rowIndex);
      const width = cropWidth();
      const height =
        rowIndex === ROWS.length - 1
          ? Math.min(GRID.cropHeight, (meta.height ?? 679) - top - 2)
          : GRID.cropHeight;

      const outPath = path.join(OUT_DIR, `${letter}.png`);

      await sharp(sourcePath)
        .extract({ left, top, width, height })
        .png({ quality: 90 })
        .toFile(outPath);

      count++;
      console.log(`  ${letter.toUpperCase()} → ${outPath} (${left},${top} ${width}×${height})`);
    }
  }

  const unknownSvg = path.join(OUT_DIR, "unknown.svg");
  if (fs.existsSync(unknownSvg)) fs.unlinkSync(unknownSvg);

  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.endsWith(".svg")) fs.unlinkSync(path.join(OUT_DIR, file));
  }

  console.log(`\nListo: ${count} letras en ${OUT_DIR}`);
}

const source = process.argv[2] ?? DEFAULT_SOURCE;
splitAlphabet(source).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
