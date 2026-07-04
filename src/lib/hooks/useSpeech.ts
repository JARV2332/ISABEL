"use client";

/**
 * Hook para reconocimiento y síntesis de habla.
 * Conecta con: Web Speech API, ElevenLabs, OpenAI.
 *
 * TODO: Implementar reconocimiento continuo y feedback accesible.
 */
export function useSpeech() {
  return {
    isListening: false,
    transcript: "",
    error: null as string | null,
    startListening: async () => {
      /* TODO */
    },
    stopListening: async () => {
      /* TODO */
    },
    speak: async (_text: string) => {
      /* TODO */
    },
  };
}
