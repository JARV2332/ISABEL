/**
 * Integración con ElevenLabs (síntesis de voz).
 * TODO: Conectar API key e implementar text-to-speech.
 */

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
}

export interface TextToSpeechRequest {
  text: string;
  voiceId?: string;
}

export interface ElevenLabsService {
  synthesize(request: TextToSpeechRequest): Promise<ArrayBuffer>;
  listVoices(): Promise<unknown[]>;
}

export const elevenLabsService: ElevenLabsService = {
  async synthesize() {
    throw new Error("ElevenLabs: servicio no implementado");
  },
  async listVoices() {
    throw new Error("ElevenLabs: servicio no implementado");
  },
};
