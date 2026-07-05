/** Trocea texto largo para TTS (límite ~2500 caracteres por llamada). */
const DEFAULT_CHUNK = 2400;

export function splitTextForTts(
  text: string,
  maxLen = DEFAULT_CHUNK
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= maxLen) return [normalized];

  const chunks: string[] = [];
  let rest = normalized;

  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf(". ", maxLen);
    if (cut < maxLen * 0.4) cut = rest.lastIndexOf(" ", maxLen);
    if (cut <= 0) cut = maxLen;

    const piece = rest.slice(0, cut + 1).trim();
    if (piece) chunks.push(piece);
    rest = rest.slice(cut + 1).trim();
  }

  if (rest) chunks.push(rest);
  return chunks;
}
