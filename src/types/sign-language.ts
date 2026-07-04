/**
 * Tipos para lenguaje de señas (LSM — Lengua de Señas Mexicana).
 * Flujo: Texto → gloss LSM → secuencia de señas → avatar.
 */

export type SignLanguageCode = "LSM" | "ASL" | "LSE";

/** Una seña individual en la secuencia del avatar */
export interface SignUnit {
  /** Identificador técnico de la seña (ej: "HOLA") */
  gloss: string;
  /** Etiqueta legible en español */
  label: string;
  /** URL de imagen LSM (dactilología o seña ilustrada) */
  imageUrl?: string;
  /** Representación visual provisional (emoji/icono) */
  icon?: string;
  /** URL de video LSM pregrabado (cuando n8n o el servicio lo provea) */
  videoUrl?: string;
  /** Instrucciones BML opcionales para Performs (desde n8n o Animics) */
  performsBml?: Array<Record<string, unknown>>;
}

/** Secuencia completa para que el avatar interprete un mensaje */
export interface SignLanguageSequence {
  language: SignLanguageCode;
  sourceText: string;
  signs: SignUnit[];
  /** URL de video completo generado por servicio externo (Sign-Speak, etc.) */
  avatarVideoUrl?: string;
}

export interface SignLanguageServiceResponse {
  sequence: SignLanguageSequence;
}
