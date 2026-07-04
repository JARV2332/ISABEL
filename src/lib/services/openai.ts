/**
 * Integración con OpenAI — respuestas conversacionales de ISA.
 */

import {
  buildIsaUserMessage,
  ISA_SYSTEM_PROMPT,
} from "@/lib/services/isa-prompt";

export interface ChatCompletionRequest {
  prompt: string;
  moduleId?: string;
  event?: string;
  model?: string;
}

export interface OpenAIService {
  complete(request: ChatCompletionRequest): Promise<string>;
  isConfigured(): boolean;
}

function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

export const openAIService: OpenAIService = {
  isConfigured() {
    return Boolean(getApiKey());
  },

  async complete({ prompt, moduleId = "general", event = "message", model }) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("OpenAI: OPENAI_API_KEY no configurada");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
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
      throw new Error(`OpenAI: error ${response.status} — ${err.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI: respuesta vacía");
    return text;
  },
};
