import { NextResponse, type NextRequest } from "next/server";

import {
  isSignVisionConfigured,
  recognizeSignFromFrame,
} from "@/lib/services/sign-recognize";

/** POST /api/sign-recognize — interpreta seña desde frame de cámara (visión IA) */
export async function POST(request: NextRequest) {
  try {
    if (!isSignVisionConfigured()) {
      return NextResponse.json(
        {
          error:
            "Visión IA no configurada — agrega GROQ_API_KEY u OPENAI_API_KEY",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      frame?: string;
      format?: "jpeg" | "png";
      localHint?: string;
    };

    if (!body.frame?.trim()) {
      return NextResponse.json({ error: "frame requerido" }, { status: 400 });
    }

    const visionText = await recognizeSignFromFrame(
      body.frame.trim(),
      body.format ?? "jpeg"
    );

    const output =
      visionText ??
      (body.localHint ? body.localHint : null);

    if (!output) {
      return NextResponse.json(
        { output: null, message: "No se reconoció la seña — intenta de nuevo" },
        { status: 200 }
      );
    }

    return NextResponse.json({ output, source: visionText ? "vision" : "local" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al reconocer seña";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
