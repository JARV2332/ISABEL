import { NextResponse, type NextRequest } from "next/server";

import { enrichIsaResponse } from "@/lib/services/isa-orchestrator";
import type { N8nWebhookPayload, N8nWebhookResponse } from "@/lib/services/n8n";
import { notifyN8nEvent } from "@/lib/services/n8n-notify";
import { signLanguageService } from "@/lib/services/sign-language";
import { signSpeakService } from "@/lib/services/sign-speak";

type RouteContext = { params: Promise<{ moduleId: string }> };

function getN8nBaseUrl(): string | undefined {
  return process.env.N8N_WEBHOOK_BASE_URL ?? process.env.NEXT_PUBLIC_N8N_BASE_URL;
}

function buildLocalMock(
  moduleId: string,
  payload: N8nWebhookPayload
): N8nWebhookResponse {
  const input =
    typeof payload.data.input === "string"
      ? payload.data.input
      : typeof payload.data.transcript === "string"
        ? payload.data.transcript
        : typeof payload.data.action === "string"
          ? payload.data.action
          : "contenido recibido";

  if (moduleId === "iot") {
    const action = String(payload.data.action ?? "ping");
    return {
      output: `Dispositivo ISABEL: acción ${action} registrada`,
      device: {
        connected: true,
        led: action === "emergency" ? "red" : "green",
        message: `IoT simulado — ${action}`,
      },
    };
  }

  const signs = signLanguageService.textToSequence(input);

  return {
    output: input,
    message: "Modo local — configura N8N_WEBHOOK_BASE_URL en .env.local",
    signSequence: signs.signs.map((s) => ({
      gloss: s.gloss,
      label: s.label,
      icon: s.icon,
      videoUrl: s.videoUrl,
    })),
    signLanguage: "LSM",
  };
}

async function forwardToN8n(
  moduleId: string,
  payload: N8nWebhookPayload
): Promise<N8nWebhookResponse> {
  const baseUrl = getN8nBaseUrl();
  if (!baseUrl) return buildLocalMock(moduleId, payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = process.env.N8N_API_KEY ?? process.env.NEXT_PUBLIC_N8N_API_KEY;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(`${baseUrl}/webhook/${moduleId}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`n8n respondió con error ${response.status}`);
  }

  return (await response.json()) as N8nWebhookResponse;
}

async function enrichWithSignSpeak(
  payload: N8nWebhookPayload,
  response: N8nWebhookResponse
): Promise<N8nWebhookResponse> {
  if (!signSpeakService.isConfigured()) return response;

  if (payload.event === "hearing.sign-capture" && payload.data.videoFrame) {
    const text = await signSpeakService.recognizeSign(
      String(payload.data.videoFrame)
    );
    return { ...response, output: text || response.output };
  }

  const text = response.output ?? response.text ?? "";
  if (
    text &&
    (payload.event.includes("transcribe") ||
      payload.event.includes("communicate") ||
      payload.event.includes("sign-produce"))
  ) {
    const videoUrl = await signSpeakService.produceSign(text);
    if (videoUrl) {
      return { ...response, avatarVideoUrl: videoUrl, output: text };
    }
  }

  return response;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const payload = (await request.json()) as N8nWebhookPayload;

    let response = await forwardToN8n(moduleId, payload);
    response = await enrichWithSignSpeak(payload, response);
    response = await enrichIsaResponse(moduleId, payload, response);

    const output =
      response.output ?? response.text ?? response.message ?? "";

    const { logInteraction, logIotEvent } = await import(
      "@/lib/services/interactions"
    );

    if (moduleId === "iot") {
      await logIotEvent(
        String(payload.data.action ?? "unknown"),
        response.device?.led,
        { event: payload.event, output }
      );

      if (payload.data.action === "emergency") {
        void notifyN8nEvent("mobility-events", {
          event: "iot.emergency",
          moduleId: "iot",
          data: {
            action: payload.data.action,
            output,
            led: response.device?.led,
          },
        });
      }
    } else {
      await logInteraction({
        moduleId,
        eventType: payload.event,
        inputText:
          typeof payload.data.input === "string"
            ? payload.data.input
            : typeof payload.data.transcript === "string"
              ? payload.data.transcript
              : undefined,
        outputText: output,
        audioUrl: response.audioUrl,
      });
    }

    return NextResponse.json({ ...response, output });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
