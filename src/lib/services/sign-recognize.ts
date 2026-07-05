/**
 * Reconocimiento de señas vía visión (Groq/OpenAI) cuando la dactilología local no alcanza.
 */

const VISION_PROMPT = `Eres un intérprete de Lenguaje de Señas Mexicano (LSM).
Analiza la imagen: una persona hace una seña frente a la cámara.
Responde SOLO con:
- Una letra (A-Z) si es dactilología, o
- Una palabra corta en español si reconoces el signo completo.
Si no ves una mano clara o una seña reconocible, responde exactamente: DESCONOCIDO
Sin explicaciones ni puntuación extra.`;

function getVisionProvider(): {
  apiKey: string;
  baseUrl: string;
  model: string;
} | null {
  if (process.env.GROQ_API_KEY) {
    return {
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
      model:
        process.env.GROQ_VISION_MODEL ??
        "meta-llama/llama-4-scout-17b-16e-instruct",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: "https://api.openai.com/v1",
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
    };
  }
  return null;
}

export function isSignVisionConfigured(): boolean {
  return getVisionProvider() !== null;
}

export async function recognizeSignFromFrame(
  imageBase64: string,
  format: "jpeg" | "png" = "jpeg"
): Promise<string | null> {
  const provider = getVisionProvider();
  if (!provider) return null;

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:image/${format};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 32,
      temperature: 0.1,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content?.trim().toUpperCase();
  if (!raw || raw === "DESCONOCIDO" || raw.includes("DESCONOCID")) return null;

  return raw.charAt(0) + raw.slice(1).toLowerCase();
}
