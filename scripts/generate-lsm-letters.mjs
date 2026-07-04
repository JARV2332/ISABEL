import fs from "node:fs";
import path from "node:path";

const outDir = path.join("public", "signs", "lsm", "letters");
fs.mkdirSync(outDir, { recursive: true });

const letters = "abcdefghijklmnopqrstuvwxyz".split("").concat(["ñ"]);
const hand =
  '<path d="M100 155c-28 0-42 22-42 44 0 32 42 40 42 40s42-8 42-40c0-22-14-44-42-44z" fill="#1e3a5f" stroke="#7dd3fc" stroke-width="2"/>';

for (const letter of letters) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" role="img" aria-label="Letra ${letter.toUpperCase()} dactilologia LSM">
  <rect width="200" height="280" rx="16" fill="#0b1f3a"/>
  <rect x="8" y="8" width="184" height="264" rx="12" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.4"/>
  <text x="100" y="95" text-anchor="middle" dominant-baseline="middle" fill="#38bdf8" font-size="76" font-family="system-ui,sans-serif" font-weight="700">${letter.toUpperCase()}</text>
  ${hand}
  <text x="100" y="255" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui,sans-serif">Dactilologia LSM</text>
</svg>`;
  fs.writeFileSync(path.join(outDir, `${letter}.svg`), svg);
}

const unknown = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" role="img" aria-label="Letra no disponible">
  <rect width="200" height="280" rx="16" fill="#0b1f3a"/>
  <text x="100" y="140" text-anchor="middle" fill="#94a3b8" font-size="64" font-family="system-ui">?</text>
</svg>`;
fs.writeFileSync(path.join(outDir, "unknown.svg"), unknown);

console.log(`Created ${letters.length + 1} letter SVGs in ${outDir}`);
