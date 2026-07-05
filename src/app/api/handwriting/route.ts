import { NextResponse, type NextRequest } from "next/server";

import {
  isHandwritingVisionConfigured,
  recognizeHandwriting,
} from "@/lib/services/handwriting-recognize";

/** POST /api/handwriting — convierte trazo de pizarra a texto (accesible) */
export async function POST(request: NextRequest) {
  try {
    if (!isHandwritingVisionConfigured()) {
      return NextResponse.json(
        {
          error:
            "Visión IA no configurada — agrega OPENAI_API_KEY o GROQ_API_KEY en .env.local",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      image?: string;
      format?: "jpeg" | "png";
    };

    if (!body.image?.trim()) {
      return NextResponse.json({ error: "image requerida" }, { status: 400 });
    }

    const raw = body.image.trim();
    const base64 = raw.includes(",") ? (raw.split(",")[1] ?? raw) : raw;

    const { text, provider } = await recognizeHandwriting(
      base64,
      body.format ?? "png"
    );

    if (!text) {
      return NextResponse.json(
        {
          text: null,
          message:
            "No pude leer el trazo. Intenta letras más grandes o toca «Hablar» de nuevo.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ text, provider });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al leer escritura";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
