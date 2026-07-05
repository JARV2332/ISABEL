/**
 * Estado de integraciones — qué servicios están realmente configurados.
 */

import { elevenLabsService } from "@/lib/services/elevenlabs";
import { isSupabaseConfigured } from "@/lib/services/interactions";
import { isaAiService } from "@/lib/services/isa-ai";

export interface ServiceStatus {
  id: string;
  name: string;
  configured: boolean;
  envVars: string[];
  docsPath: string;
}

export function getServicesStatus(): ServiceStatus[] {
  const n8nUrl =
    process.env.N8N_WEBHOOK_BASE_URL ?? process.env.NEXT_PUBLIC_N8N_BASE_URL;

  return [
    {
      id: "n8n",
      name: "n8n Cloud",
      configured: Boolean(n8nUrl),
      envVars: ["N8N_WEBHOOK_BASE_URL"],
      docsPath: "docs/N8N-SETUP.md",
    },
    {
      id: "isa-ai",
      name: isaAiService.getProviderLabel(),
      configured: isaAiService.isConfigured(),
      envVars: ["GROQ_API_KEY (gratis) o OPENAI_API_KEY"],
      docsPath: "docs/SETUP-CUENTAS.md#2-ia-isa-groq-u-openai",
    },
    {
      id: "elevenlabs",
      name: "ElevenLabs (voz ISA)",
      configured: elevenLabsService.isConfigured(),
      envVars: ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID (opcional)"],
      docsPath: "docs/SETUP-CUENTAS.md#3-elevenlabs",
    },
    {
      id: "supabase",
      name: "Supabase (historial)",
      configured: isSupabaseConfigured(),
      envVars: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY (para escribir logs)",
      ],
      docsPath: "docs/SETUP-CUENTAS.md#4-supabase",
    },
  ];
}

export function getN8nBaseUrl(): string | undefined {
  return (
    process.env.N8N_WEBHOOK_BASE_URL ?? process.env.NEXT_PUBLIC_N8N_BASE_URL
  );
}
