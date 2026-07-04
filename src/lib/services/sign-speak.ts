/**
 * Integración con Sign-Speak (avatar ASL/LSM + reconocimiento de señas).
 * Las API keys NUNCA van al navegador — solo se usan en el servidor.
 *
 * Documentación: https://app.theneo.io/sign-speak/sign-speak-api/api-specifications
 * Portal: https://sign-speak.com
 */

const SIGN_SPEAK_BASE = "https://api.sign-speak.com";

export interface SignSpeakProduceRequest {
  english: string;
  model?: "MALE" | "FEMALE";
}

export interface SignSpeakService {
  isConfigured(): boolean;
  produceSign(text: string): Promise<string | null>;
  recognizeSign(videoBase64: string): Promise<string | null>;
}

function getApiKey(): string | undefined {
  return process.env.SIGN_SPEAK_API_KEY;
}

export const signSpeakService: SignSpeakService = {
  isConfigured() {
    return Boolean(getApiKey());
  },

  async produceSign(text) {
    const apiKey = getApiKey();
    if (!apiKey || !text.trim()) return null;

    try {
      const response = await fetch(`${SIGN_SPEAK_BASE}/produceASL`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          english: text,
          model: "FEMALE",
          request_class: "BLOCKING",
        }),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as {
        video_url?: string;
        url?: string;
        payload?: string;
      };

      return data.video_url ?? data.url ?? null;
    } catch {
      return null;
    }
  },

  async recognizeSign(videoBase64) {
    const apiKey = getApiKey();
    if (!apiKey || !videoBase64) return null;

    try {
      const response = await fetch(`${SIGN_SPEAK_BASE}/recognizeASL`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({ payload: videoBase64 }),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as {
        text?: string;
        english?: string;
        transcript?: string;
      };

      return data.text ?? data.english ?? data.transcript ?? null;
    } catch {
      return null;
    }
  },
};
