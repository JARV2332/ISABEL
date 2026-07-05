#!/usr/bin/env node
/** Strips Cursor co-author trailers; rewrites commit msg filter (stdin/stdout). */
const fs = require("fs");

const CURSOR_LINE =
  /co-?authored-?by:.*cursor|cursoragent@cursor\.com|made-?with:.*cursor|cursor ai/i;

function clean(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !CURSOR_LINE.test(line))
    .map((line) =>
      line
        .replace(/co-autor de Cursor/gi, "co-autores no deseados")
        .replace(/coautoria de Cursor/gi, "coautoria no deseada")
        .replace(/Cursor en commits/gi, "en commits")
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

const file = process.argv[2];

if (file) {
  const content = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, clean(content) ? `${clean(content)}\n` : "");
} else {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    data += chunk;
  });
  process.stdin.on("end", () => {
    const cleaned = clean(data);
    process.stdout.write(cleaned ? `${cleaned}\n` : "");
  });
}
