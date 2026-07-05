/**
 * Orquestador ISA — enriquece respuestas n8n con Groq/OpenAI + ElevenLabs
 * cuando las API keys están configuradas en el servidor.
 */

import { elevenLabsService } from "@/lib/services/elevenlabs";
import { isaAiService } from "@/lib/services/isa-ai";
import type { N8nWebhookPayload, N8nWebhookResponse } from "@/lib/services/n8n";
import { signLanguageService } from "@/lib/services/sign-language";

function extractInput(payload: N8nWebhookPayload): string {
  if (typeof payload.data.input === "string" && payload.data.input.trim()) {
    return payload.data.input.trim();
  }
  if (typeof payload.data.transcript === "string" && payload.data.transcript.trim()) {
    return payload.data.transcript.trim();
  }
  if (typeof payload.data.message === "string" && payload.data.message.trim()) {
    return payload.data.message.trim();
  }
  return "";
}

function shouldGenerateIsaResponse(payload: N8nWebhookPayload): boolean {
  if (payload.moduleId === "iot") return false;
  return Boolean(extractInput(payload));
}

export async function enrichIsaResponse(
  moduleId: string,
  payload: N8nWebhookPayload,
  response: N8nWebhookResponse
): Promise<N8nWebhookResponse> {
  const input = extractInput(payload);
  let output =
    response.output ?? response.text ?? response.message ?? input;

  const isLocalMock =
    response.message?.includes("Modo local") ||
    response.message?.includes("simulada") ||
    response.message?.includes("configura N8N");

  const n8nReturnedRichResponse =
    Boolean(response.audioUrl) ||
    (Boolean(response.output) &&
      response.output !== input &&
      !isLocalMock);

  if (
    shouldGenerateIsaResponse(payload) &&
    isaAiService.isConfigured() &&
    !n8nReturnedRichResponse
  ) {
    try {
      output = await isaAiService.complete({
        prompt: input,
        moduleId,
        event: payload.event,
      });
    } catch {
      /* mantener output de n8n */
    }
  }

  const signs =
    response.signSequence && response.signSequence.length > 0
      ? response.signSequence
      : signLanguageService.textToSequence(input || output).signs.map((s) => ({
          gloss: s.gloss,
          label: s.label,
          icon: s.icon,
          videoUrl: s.videoUrl,
        }));

  let audioUrl = response.audioUrl;
  const elevenLabsAvailable = elevenLabsService.isConfigured();

  // No embebemos MP3 en base64 (lento y falla en el navegador).
  // El cliente llama POST /api/tts con el texto de ISA.
  if (elevenLabsAvailable && !audioUrl?.startsWith("http")) {
    audioUrl = undefined;
  }

  return {
    ...response,
    output,
    signSequence: signs,
    signLanguage: response.signLanguage ?? "LSM",
    audioUrl,
    elevenLabsAvailable,
  };
}
