"use client";

/**
 * Hook para captura y procesamiento de voz.
 * Conecta con: ElevenLabs, OpenAI (cuando se implemente).
 *
 * TODO: Implementar grabación, transcripción y síntesis.
 */
export function useVoice() {
  return {
    isRecording: false,
    isProcessing: false,
    error: null as string | null,
    startRecording: async () => {
      /* TODO */
    },
    stopRecording: async () => {
      /* TODO */
    },
  };
}
