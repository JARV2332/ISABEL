/**
 * Orquestador ISA — enriquece respuestas n8n con OpenAI + ElevenLabs
 * cuando las API keys están configuradas en el servidor.
 */

import { elevenLabsService } from "@/lib/services/elevenlabs";
import { openAIService } from "@/lib/services/openai";
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

  if (
    shouldGenerateIsaResponse(payload) &&
    openAIService.isConfigured() &&
    (!output || output === input || response.message?.includes("simulada"))
  ) {
    try {
      output = await openAIService.complete({
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

  if (!audioUrl && output && elevenLabsService.isConfigured()) {
    try {
      audioUrl = await elevenLabsService.synthesizeToDataUrl({ text: output });
    } catch {
      /* fallback a speechSynthesis en cliente */
    }
  }

  return {
    ...response,
    output,
    signSequence: signs,
    signLanguage: response.signLanguage ?? "LSM",
    audioUrl,
  };
}
