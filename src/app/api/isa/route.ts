import { NextResponse, type NextRequest } from "next/server";

import { openAIService } from "@/lib/services/openai";

export async function POST(request: NextRequest) {
  try {
    if (!openAIService.isConfigured()) {
      return NextResponse.json(
        { error: "OpenAI no configurado (OPENAI_API_KEY)" },
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

    const output = await openAIService.complete({
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
