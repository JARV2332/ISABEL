/**
 * Motor conversacional de ISA — Groq (gratis) u OpenAI.
 * Groq usa API compatible con OpenAI: https://console.groq.com
 */

import {
  buildIsaUserMessage,
  ISA_SYSTEM_PROMPT,
} from "@/lib/services/isa-prompt";

export type IsaAiProvider = "groq" | "openai";

export interface ChatCompletionRequest {
  prompt: string;
  moduleId?: string;
  event?: string;
  model?: string;
}

export interface IsaAiService {
  complete(request: ChatCompletionRequest): Promise<string>;
  isConfigured(): boolean;
  getProvider(): IsaAiProvider | null;
  getProviderLabel(): string;
}

interface ProviderConfig {
  provider: IsaAiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  label: string;
}

function resolveProvider(): ProviderConfig | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      provider: "groq",
      apiKey: groqKey,
      baseUrl:
        process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      label: "Groq (Llama)",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      baseUrl: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      label: "OpenAI (GPT)",
    };
  }

  return null;
}

export const isaAiService: IsaAiService = {
  isConfigured() {
    return resolveProvider() !== null;
  },

  getProvider() {
    return resolveProvider()?.provider ?? null;
  },

  getProviderLabel() {
    return resolveProvider()?.label ?? "ISA (IA no configurada)";
  },

  async complete({ prompt, moduleId = "general", event = "message", model }) {
    const config = resolveProvider();
    if (!config) {
      throw new Error(
        "ISA IA: configura GROQ_API_KEY (gratis) u OPENAI_API_KEY en .env.local"
      );
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model ?? config.model,
        messages: [
          { role: "system", content: ISA_SYSTEM_PROMPT },
          {
            role: "user",
            content: buildIsaUserMessage(moduleId, event, prompt),
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(
        `${config.label}: error ${response.status} — ${err.slice(0, 200)}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error(`${config.label}: respuesta vacía`);
    return text;
  },
};

/** @deprecated Usar isaAiService */
export const openAIService = isaAiService;
