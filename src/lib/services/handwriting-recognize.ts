/**
 * Reconocimiento de escritura a mano — optimizado para accesibilidad motriz.
 * Tolera trazos temblorosos, letras separadas e irregularidades.
 */

const SYSTEM_PROMPT = `Eres el motor de lectura de la Pizarra Inteligente de ISABEL.
Usuarios con discapacidad motriz escriben con trazo tembloroso, letras mal formadas o separadas.
Eso NO es un error — debes interpretar con empatía y generosidad.
Lees español en pizarras digitales con fondo claro y trazo oscuro.`;

function buildUserPrompt(context?: string): string {
  const contextBlock = context?.trim()
    ? `\nCONTEXTO — el usuario ya escribió antes: «${context.trim()}»
Si el trazo nuevo continúa esa frase, devuelve SOLO las palabras nuevas (no repitas lo anterior).
Si el trazo es una frase completa independiente, devuelve la frase entera.\n`
    : "";

  return `Analiza esta imagen de pizarra digital (fondo blanco, trazo negro).
${contextBlock}
REGLAS:
1. Lee de izquierda a derecha TODAS las palabras visibles, en orden.
2. Si hay varias palabras en la misma línea, sepáralas con espacio (ej: "quiero agua", "hola mamá").
3. Une letras sueltas si forman palabra (ej: "J o r g e" → Jorge, "q u i e r o" → quiero).
4. Tolera caligrafía irregular, temblorosa, infantil o letras muy separadas.
5. Nombres y frases comunes: Hola, Quiero, Agua, Ayuda, Baño, Mamá, Papá, Gracias, Por favor.
6. Si hay dos renglones, une con espacio en el orden visual (arriba → abajo).
7. Responde UNA sola línea con SOLO el texto leído, sin comillas, explicación ni puntuación extra.
8. Responde VACIO únicamente si no hay ningún trazo negro visible.`;
}

interface VisionProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  priority: number;
}

function getVisionProviders(): VisionProvider[] {
  const list: VisionProvider[] = [];

  if (process.env.OPENAI_API_KEY) {
    const key = process.env.OPENAI_API_KEY;
    const base = "https://api.openai.com/v1";
    const primary = process.env.OPENAI_VISION_MODEL ?? "gpt-4o";
    list.push({
      name: "openai-primary",
      apiKey: key,
      baseUrl: base,
      model: primary,
      priority: primary.includes("4o") && !primary.includes("mini") ? 0 : 1,
    });
    if (primary !== "gpt-4o") {
      list.push({
        name: "openai-4o",
        apiKey: key,
        baseUrl: base,
        model: "gpt-4o",
        priority: 0,
      });
    }
    if (primary !== "gpt-4o-mini") {
      list.push({
        name: "openai-4o-mini",
        apiKey: key,
        baseUrl: base,
        model: "gpt-4o-mini",
        priority: 2,
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
      priority: 3,
    });
    list.push({
      name: "groq-11b",
      apiKey: key,
      baseUrl: base,
      model: process.env.GROQ_VISION_MODEL ?? "llama-3.2-11b-vision-preview",
      priority: 4,
    });
  }

  return list.sort((a, b) => a.priority - b.priority);
}

export function isHandwritingVisionConfigured(): boolean {
  return getVisionProviders().length > 0;
}

function cleanVisionOutput(raw: string): string | null {
  let text = raw.trim();
  text = text.replace(/^["'`«»]+|["'`«»]+$/g, "");
  text = text.replace(/^(texto|respuesta|lectura|resultado):\s*/i, "");
  text = text.replace(/\s+/g, " ");

  if (
    !text ||
    text.toUpperCase() === "VACIO" ||
    /^no\s+(hay|se|puedo|veo|encuentro)/i.test(text) ||
    /ilegible|sin\s+trazo/i.test(text)
  ) {
    return null;
  }

  return text.trim();
}

/** Normaliza lectura y evita duplicar contexto previo. */
export function mergeHandwritingWithContext(
  reading: string,
  context?: string
): string {
  let text = reading.trim().replace(/\s+/g, " ");
  const prev = context?.trim();

  if (!prev) return text;

  const prevLower = prev.toLowerCase();
  const textLower = text.toLowerCase();

  if (textLower.startsWith(prevLower)) {
    text = text.slice(prev.length).trim();
  }

  if (!text) return prev;

  return `${prev} ${text}`.replace(/\s+/g, " ").trim();
}

function scoreReading(text: string): number {
  if (!text) return 0;
  const words = text.split(/\s+/);
  let score = text.length;
  if (words.length >= 2) score += 15;
  if (/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(text)) score += 10;
  if (text.length === 1) score -= 20;
  return score;
}

async function callVisionModel(
  provider: VisionProvider,
  imageBase64: string,
  format: "jpeg" | "png",
  context?: string
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
            { type: "text", text: buildUserPrompt(context) },
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
      max_tokens: 200,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.warn(
      `[handwriting] ${provider.name} falló: ${response.status} ${err.slice(0, 120)}`
    );
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;

  return cleanVisionOutput(raw);
}

/** Prueba varios modelos de visión y elige la mejor lectura. */
export async function recognizeHandwriting(
  imageBase64: string,
  format: "jpeg" | "png" = "png",
  context?: string
): Promise<{ text: string | null; provider?: string }> {
  const providers = getVisionProviders();
  if (providers.length === 0) return { text: null };

  let bestText: string | null = null;
  let bestScore = 0;
  let bestProvider: string | undefined;

  for (const provider of providers) {
    try {
      const raw = await callVisionModel(provider, imageBase64, format, context);
      if (!raw) continue;

      const merged = mergeHandwritingWithContext(raw, context);
      const score = scoreReading(merged);

      if (score > bestScore) {
        bestScore = score;
        bestText = merged;
        bestProvider = provider.name;
      }

      if (score >= 30 && merged.split(/\s+/).length >= 2) {
        return { text: merged, provider: provider.name };
      }
    } catch {
      continue;
    }
  }

  return { text: bestText, provider: bestProvider };
}
