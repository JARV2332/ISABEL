/**
 * Dactilología LSM: convierte texto a secuencia de letras con imágenes.
 * Cada letra se muestra una por una con su imagen del abecedario manual.
 */

import type { SignLanguageCode, SignLanguageSequence, SignUnit } from "@/types/sign-language";

import { withBasePath } from "@/lib/base-path";

const LETTERS_BASE_PATH = withBasePath("/signs/lsm/letters");

/** Letras del abecedario manual LSM (español) */
const LSM_ALPHABET = "abcdefghijklmnñopqrstuvwxyz";

function normalizeForSpelling(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:…'"()]/g, "")
    .replace(/\s+/g, "");
}

export function letterImageUrl(letter: string): string {
  const normalized = letter.toLowerCase();
  if (!LSM_ALPHABET.includes(normalized)) {
    return `${LETTERS_BASE_PATH}/unknown.png`;
  }
  return `${LETTERS_BASE_PATH}/${normalized}.png`;
}

export function letterToSign(letter: string): SignUnit {
  const upper = letter.toUpperCase();
  return {
    gloss: upper,
    label: upper,
    imageUrl: letterImageUrl(letter),
  };
}

/** Convierte texto a una seña por letra (dactilología) */
export function textToLetterSigns(text: string): SignUnit[] {
  const normalized = normalizeForSpelling(text);
  const signs: SignUnit[] = [];

  for (const char of normalized) {
    if (/[a-zñ]/.test(char)) {
      signs.push(letterToSign(char));
    }
  }

  return signs.length > 0 ? signs : [letterToSign("?")];
}

export function textToFingerspellingSequence(
  text: string,
  language: SignLanguageCode = "LSM"
): SignLanguageSequence {
  return {
    language,
    sourceText: text,
    signs: textToLetterSigns(text),
  };
}

/** Expande cualquier secuencia a dactilología letra por letra */
export function toFingerspellingSequence(
  sequence: SignLanguageSequence
): SignLanguageSequence {
  return textToFingerspellingSequence(sequence.sourceText, sequence.language);
}

export const FINGERSPELLING_MS = 850;
