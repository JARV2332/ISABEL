/**
 * Integración con OpenAI (procesamiento de lenguaje, transcripción, etc.).
 * TODO: Conectar API key e implementar endpoints necesarios.
 */

export interface OpenAIConfig {
  apiKey: string;
  organizationId?: string;
}

export interface ChatCompletionRequest {
  prompt: string;
  model?: string;
}

export interface OpenAIService {
  complete(request: ChatCompletionRequest): Promise<string>;
  transcribe(audio: Blob): Promise<string>;
}

export const openAIService: OpenAIService = {
  async complete() {
    throw new Error("OpenAI: servicio no implementado");
  },
  async transcribe() {
    throw new Error("OpenAI: servicio no implementado");
  },
};
