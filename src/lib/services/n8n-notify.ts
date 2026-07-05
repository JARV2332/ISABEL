/**
 * Notificaciones asíncronas a n8n (no bloquean la UI).
 * Usar webhooks dedicados: mobility-events, alerts, etc.
 */

import type { N8nWebhookPayload } from "@/lib/services/n8n";

function getN8nBaseUrl(): string | undefined {
  return (
    process.env.N8N_WEBHOOK_BASE_URL ??
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE_URL ??
    process.env.N8N_BASE_URL ??
    process.env.NEXT_PUBLIC_N8N_BASE_URL
  );
}

/** Envía evento a n8n sin esperar respuesta enriquecida (fire-and-forget). */
export async function notifyN8nEvent(
  webhookPath: string,
  payload: N8nWebhookPayload
): Promise<boolean> {
  const baseUrl = getN8nBaseUrl();
  if (!baseUrl) return false;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = process.env.N8N_API_KEY ?? process.env.NEXT_PUBLIC_N8N_API_KEY;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await fetch(`${baseUrl}/webhook/${webhookPath}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
