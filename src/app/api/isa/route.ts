import { NextResponse, type NextRequest } from "next/server";

import { isaAiService } from "@/lib/services/isa-ai";

export async function POST(request: NextRequest) {
  try {
    if (!isaAiService.isConfigured()) {
      return NextResponse.json(
        {
          error:
            "ISA IA no configurada — agrega GROQ_API_KEY (gratis) u OPENAI_API_KEY en .env.local",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      prompt?: string;
      moduleId?: string;
      event?: string;
    };

    if (!body.prompt?.trim()) {
      return NextResponse.json({ error: "prompt requerido" }, { status: 400 });
    }

    const output = await isaAiService.complete({
      prompt: body.prompt.trim(),
      moduleId: body.moduleId,
      event: body.event,
    });

    return NextResponse.json({ output });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al consultar ISA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
