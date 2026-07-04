/**
 * Integración con ElevenLabs — síntesis de voz de ISA.
 */

export interface TextToSpeechRequest {
  text: string;
  voiceId?: string;
}

export interface ElevenLabsService {
  synthesize(request: TextToSpeechRequest): Promise<ArrayBuffer>;
  synthesizeToDataUrl(request: TextToSpeechRequest): Promise<string>;
  isConfigured(): boolean;
}

function getApiKey(): string | undefined {
  return process.env.ELEVENLABS_API_KEY;
}

function getVoiceId(override?: string): string {
  return (
    override ??
    process.env.ELEVENLABS_VOICE_ID ??
    "EXAVITQu4vr4xnSDxMaL"
  );
}

function getModelId(): string {
  return process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";
}

export const elevenLabsService: ElevenLabsService = {
  isConfigured() {
    return Boolean(getApiKey());
  },

  async synthesize({ text, voiceId }) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("ElevenLabs: ELEVENLABS_API_KEY no configurada");
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${getVoiceId(voiceId)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: getModelId(),
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(
        `ElevenLabs: error ${response.status} — ${err.slice(0, 200)}`
      );
    }

    return response.arrayBuffer();
  },

  async synthesizeToDataUrl(request) {
    const buffer = await this.synthesize(request);
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:audio/mpeg;base64,${base64}`;
  },
};
