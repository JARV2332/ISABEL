import { NextResponse, type NextRequest } from "next/server";

import {
  logInteraction,
  type LogInteractionInput,
} from "@/lib/services/interactions";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LogInteractionInput;

    if (!body.moduleId || !body.eventType) {
      return NextResponse.json(
        { error: "moduleId y eventType son requeridos" },
        { status: 400 }
      );
    }

    await logInteraction(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al registrar interacción";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
