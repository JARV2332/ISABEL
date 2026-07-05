/**
 * Reconocimiento de escritura a mano — optimizado para accesibilidad motriz.
 * Tolera trazos temblorosos, letras separadas e irregularidades.
 */

const SYSTEM_PROMPT = `Eres el motor de lectura de la Pizarra Inteligente de ISABEL (EDUKIDS).
Usuarios con discapacidad motriz escriben con trazo tembloroso, letras mal formadas o separadas.
Eso NO es un error — debes interpretar con empatía y generosidad.`;

const USER_PROMPT = `Analiza esta imagen de pizarra digital (fondo claro, trazo oscuro).

REGLAS:
1. Si ves CUALQUIER trazo que parezca texto, devuelve la mejor interpretación en español.
2. Une letras sueltas si forman palabra o nombre (ej: "J o r g e" → Jorge).
3. Tolera caligrafía muy irregular, temblorosa o infantil.
4. Nombres propios son comunes — respétalos (Jorge, María, Hola, Agua, etc.).
5. Responde UNA sola línea con SOLO el texto leído, sin comillas ni explicación.
6. Responde VACIO únicamente si la imagen no tiene ningún trazo oscuro visible.`;

interface VisionProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

function getVisionProviders(): VisionProvider[] {
  const list: VisionProvider[] = [];

  if (process.env.OPENAI_API_KEY) {
    const key = process.env.OPENAI_API_KEY;
    const base = "https://api.openai.com/v1";
    list.push({
      name: "openai-4o",
      apiKey: key,
      baseUrl: base,
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o",
    });
    if ((process.env.OPENAI_VISION_MODEL ?? "gpt-4o") !== "gpt-4o-mini") {
      list.push({
        name: "openai-4o-mini",
        apiKey: key,
        baseUrl: base,
        model: "gpt-4o-mini",
      });
    }
  }

  if (process.env.GROQ_API_KEY) {
    const key = process.env.GROQ_API_KEY;
    const base = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
    list.push({
      name: "groq-90b",
      apiKey: key,
      baseUrl: base,
      model: "llama-3.2-90b-vision-preview",
    });
    list.push({
      name: "groq-11b",
      apiKey: key,
      baseUrl: base,
      model: process.env.GROQ_VISION_MODEL ?? "llama-3.2-11b-vision-preview",
    });
  }

  return list;
}

export function isHandwritingVisionConfigured(): boolean {
  return getVisionProviders().length > 0;
}

function cleanVisionOutput(raw: string): string | null {
  let text = raw.trim();
  text = text.replace(/^["'`]+|["'`]+$/g, "");
  text = text.replace(/^(texto|respuesta|lectura):\s*/i, "");

  if (
    !text ||
    text.toUpperCase() === "VACIO" ||
    /^no\s+(hay|se|puedo|veo)/i.test(text) ||
    /ilegible/i.test(text)
  ) {
    return null;
  }

  return text.trim();
}

async function callVisionModel(
  provider: VisionProvider,
  imageBase64: string,
  format: "jpeg" | "png"
): Promise<string | null> {
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:image/${format};base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 80,
      temperature: 0.35,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.warn(`[handwriting] ${provider.name} falló: ${response.status} ${err.slice(0, 120)}`);
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;

  return cleanVisionOutput(raw);
}

/** Prueba varios modelos de visión hasta obtener lectura. */
export async function recognizeHandwriting(
  imageBase64: string,
  format: "jpeg" | "png" = "png"
): Promise<{ text: string | null; provider?: string }> {
  const providers = getVisionProviders();
  if (providers.length === 0) return { text: null };

  let lastGuess: string | null = null;

  for (const provider of providers) {
    try {
      const text = await callVisionModel(provider, imageBase64, format);
      if (text && text.length >= 1) {
        return { text, provider: provider.name };
      }
    } catch {
      continue;
    }
  }

  return { text: lastGuess };
}
