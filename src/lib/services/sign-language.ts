/**
 * Servicio de lenguaje de señas (LSM).
 * Convierte texto español a secuencias de señas para el avatar.
 *
 * En producción, n8n puede devolver la secuencia ya procesada
 * o conectar con APIs como Sign-Speak (speech/sign ↔ avatar).
 */

import type {
  SignLanguageCode,
  SignLanguageSequence,
  SignUnit,
} from "@/types/sign-language";

/** Glosario básico LSM para frases frecuentes en EDUKIDS */
const LSM_GLOSSARY: Record<string, Omit<SignUnit, "gloss">> = {
  "como estas": { label: "¿Cómo estás?", icon: "🫵" },
  "que tal": { label: "¿Qué tal?", icon: "👋" },
  hola: { label: "Hola", icon: "👋" },
  "buenos días": { label: "Buenos días", icon: "🌅" },
  "buenas tardes": { label: "Buenas tardes", icon: "☀️" },
  "buenas noches": { label: "Buenas noches", icon: "🌙" },
  gracias: { label: "Gracias", icon: "🙏" },
  por: { label: "Por", icon: "➡️" },
  favor: { label: "Favor", icon: "🤲" },
  sí: { label: "Sí", icon: "✅" },
  si: { label: "Sí", icon: "✅" },
  no: { label: "No", icon: "❌" },
  ayuda: { label: "Ayuda", icon: "🆘" },
  agua: { label: "Agua", icon: "💧" },
  comer: { label: "Comer", icon: "🍽️" },
  hambre: { label: "Hambre", icon: "😋" },
  baño: { label: "Baño", icon: "🚻" },
  jugar: { label: "Jugar", icon: "⚽" },
  descanso: { label: "Descanso", icon: "😴" },
  dolor: { label: "Dolor", icon: "🤕" },
  feliz: { label: "Feliz", icon: "😊" },
  triste: { label: "Triste", icon: "😢" },
  yo: { label: "Yo", icon: "👆" },
  tú: { label: "Tú", icon: "👉" },
  tu: { label: "Tú", icon: "👉" },
  quiero: { label: "Quiero", icon: "🤲" },
  necesito: { label: "Necesito", icon: "🆘" },
  cómo: { label: "Cómo", icon: "❓" },
  como: { label: "Cómo", icon: "❓" },
  estás: { label: "Estás", icon: "🫵" },
  estas: { label: "Estás", icon: "🫵" },
  bien: { label: "Bien", icon: "👍" },
  mal: { label: "Mal", icon: "👎" },
  maestro: { label: "Maestro", icon: "👩‍🏫" },
  maestra: { label: "Maestra", icon: "👩‍🏫" },
  amigo: { label: "Amigo", icon: "🤝" },
  amiga: { label: "Amiga", icon: "🤝" },
  casa: { label: "Casa", icon: "🏠" },
  escuela: { label: "Escuela", icon: "🏫" },
};

function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:]/g, "");
}

function tokenToSign(token: string): SignUnit {
  const normalized = normalizeToken(token);
  const entry = LSM_GLOSSARY[normalized];

  if (entry) {
    return { gloss: normalized.toUpperCase(), ...entry };
  }

  return {
    gloss: normalized.toUpperCase() || "SEÑA",
    label: token,
    icon: "🤟",
  };
}

function normalizeSpeechText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:…]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textToSigns(text: string): SignUnit[] {
  const phrases = Object.keys(LSM_GLOSSARY)
    .filter((key) => key.includes(" "))
    .sort((a, b) => b.length - a.length);

  let remaining = normalizeSpeechText(text);
  const signs: SignUnit[] = [];

  while (remaining.trim()) {
    let matched = false;

    for (const phrase of phrases) {
      if (remaining.startsWith(phrase)) {
        signs.push(tokenToSign(phrase));
        remaining = remaining.slice(phrase.length).trimStart();
        matched = true;
        break;
      }
    }

    if (matched) continue;

    const nextSpace = remaining.indexOf(" ");
    const token = nextSpace === -1 ? remaining : remaining.slice(0, nextSpace);
    if (token.trim()) signs.push(tokenToSign(token));
    remaining = nextSpace === -1 ? "" : remaining.slice(nextSpace + 1);
  }

  return signs.length > 0 ? signs : [tokenToSign(text)];
}

export function textToSignSequence(
  text: string,
  language: SignLanguageCode = "LSM"
): SignLanguageSequence {
  return {
    language,
    sourceText: text,
    signs: textToSigns(text),
  };
}

/** Parsea la respuesta de n8n cuando incluye datos de lenguaje de señas */
export function parseSignLanguageFromN8n(
  response: Record<string, unknown>,
  fallbackText: string
): SignLanguageSequence {
  if (typeof response.avatarVideoUrl === "string" && response.avatarVideoUrl) {
    return {
      language: "LSM",
      sourceText: fallbackText,
      signs: [],
      avatarVideoUrl: response.avatarVideoUrl,
    };
  }

  if (Array.isArray(response.signSequence)) {
    const signs = response.signSequence
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        gloss: String(item.gloss ?? item.label ?? "SEÑA"),
        label: String(item.label ?? item.gloss ?? "Seña"),
        icon: typeof item.icon === "string" ? item.icon : "🤟",
        videoUrl: typeof item.videoUrl === "string" ? item.videoUrl : undefined,
      }));

    if (signs.length > 0) {
      return {
        language: (response.signLanguage as SignLanguageCode) ?? "LSM",
        sourceText: fallbackText,
        signs,
      };
    }
  }

  return textToSignSequence(fallbackText);
}

export interface SignLanguageService {
  textToSequence(text: string): SignLanguageSequence;
  parseFromN8n(response: Record<string, unknown>, fallbackText: string): SignLanguageSequence;
}

export const signLanguageService: SignLanguageService = {
  textToSequence: textToSignSequence,
  parseFromN8n: parseSignLanguageFromN8n,
};
