import { NextResponse, type NextRequest } from "next/server";

import { elevenLabsService } from "@/lib/services/elevenlabs";

export async function POST(request: NextRequest) {
  try {
    if (!elevenLabsService.isConfigured()) {
      return NextResponse.json(
        { error: "ElevenLabs no configurado (ELEVENLABS_API_KEY)" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as { text?: string; voiceId?: string };
    if (!body.text?.trim()) {
      return NextResponse.json({ error: "text requerido" }, { status: 400 });
    }

    const audio = await elevenLabsService.synthesize({
      text: body.text.trim(),
      voiceId: body.voiceId,
    });

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al sintetizar voz";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
