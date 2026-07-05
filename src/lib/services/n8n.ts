/**
 * Integración con n8n (orquestación de flujos y automatizaciones).
 * Flujo: Módulo → webhook n8n → respuesta procesada (texto/voz).
 */

export interface N8nConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface N8nWebhookPayload {
  event: string;
  moduleId: string;
  data: Record<string, unknown>;
}

export interface N8nWebhookResponse {
  output?: string;
  text?: string;
  audioUrl?: string;
  message?: string;
  /** ElevenLabs activo en servidor — cliente usa POST /api/tts */
  elevenLabsAvailable?: boolean;
  /** URL de video del avatar firmando (servicio externo) */
  avatarVideoUrl?: string;
  /** Secuencia de señas LSM procesada por n8n */
  signSequence?: Array<{
    gloss: string;
    label: string;
    icon?: string;
    videoUrl?: string;
  }>;
  signLanguage?: "LSM" | "ASL" | "LSE";
  /** Estado simulado de dispositivo IoT */
  device?: {
    connected?: boolean;
    led?: "green" | "red" | "yellow" | "off";
    message?: string;
  };
}

export interface N8nService {
  triggerWebhook(
    webhookId: string,
    payload: N8nWebhookPayload
  ): Promise<N8nWebhookResponse>;
}

function getBaseUrl(): string | undefined {
  return (
    process.env.N8N_WEBHOOK_BASE_URL ??
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE_URL ??
    process.env.NEXT_PUBLIC_N8N_BASE_URL ??
    process.env.N8N_BASE_URL ??
    undefined
  );
}

function extractOutput(response: N8nWebhookResponse): string {
  return response.output ?? response.text ?? response.message ?? "";
}

function buildMockResponse(payload: N8nWebhookPayload): N8nWebhookResponse {
  const inputPreview =
    typeof payload.data.input === "string"
      ? payload.data.input.slice(0, 120)
      : typeof payload.data.transcript === "string"
        ? payload.data.transcript.slice(0, 120)
        : "contenido recibido";

  return {
    output: `ISA procesó tu solicitud en el módulo ${payload.moduleId}: "${inputPreview}"`,
    message: "Respuesta simulada — configura NEXT_PUBLIC_N8N_BASE_URL para producción.",
    signSequence: undefined,
  };
}

export const n8nService: N8nService = {
  async triggerWebhook(webhookId, payload) {
    const isBrowser = typeof window !== "undefined";

    if (isBrowser) {
      const response = await fetch(`/api/n8n/${webhookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(err.error ?? `n8n: error ${response.status}`);
      }

      const data = (await response.json()) as N8nWebhookResponse;
      return {
        ...data,
        output: extractOutput(data) || extractOutput(buildMockResponse(payload)),
      };
    }

    const baseUrl = getBaseUrl();

    if (!baseUrl) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return buildMockResponse(payload);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apiKey = process.env.NEXT_PUBLIC_N8N_API_KEY ?? process.env.N8N_API_KEY;
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/webhook/${webhookId}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n: error ${response.status} al procesar la solicitud`);
    }

    const data = (await response.json()) as N8nWebhookResponse;
    return { ...data, output: extractOutput(data) || extractOutput(buildMockResponse(payload)) };
  },
};

export { extractOutput as parseN8nOutput };
