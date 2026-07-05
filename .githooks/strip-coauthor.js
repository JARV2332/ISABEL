#!/usr/bin/env node
/** Removes Cursor co-author trailers from a commit message file or stdin. */
const fs = require("fs");

const CURSOR_LINE =
  /co-?authored-?by:.*cursor|cursoragent@cursor\.com|made-?with:.*cursor|cursor ai/i;

function clean(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !CURSOR_LINE.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

const file = process.argv[2];

if (file) {
  const content = fs.readFileSync(file, "utf8");
  const cleaned = clean(content);
  fs.writeFileSync(file, cleaned ? `${cleaned}\n` : "");
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
