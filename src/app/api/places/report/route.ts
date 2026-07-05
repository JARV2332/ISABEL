import { NextResponse, type NextRequest } from "next/server";

import { submitPlaceReport } from "@/lib/services/accessible-places";
import { logInteraction } from "@/lib/services/interactions";
import { notifyN8nEvent } from "@/lib/services/n8n-notify";
import type { PlaceReportInput } from "@/types/accessible-places";

/** POST /api/places/report — reporte comunitario de accesibilidad */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PlaceReportInput;

    if (
      !body.placeId ||
      !body.placeName ||
      !body.category ||
      !Number.isFinite(body.latitude) ||
      !Number.isFinite(body.longitude) ||
      !["accessible", "partial", "inaccessible"].includes(body.rating)
    ) {
      return NextResponse.json({ error: "Datos de reporte incompletos" }, { status: 400 });
    }

    const saved = await submitPlaceReport(body);

    await logInteraction({
      moduleId: "mobility",
      eventType: "mobility.place-report",
      inputText: body.placeName,
      outputText: body.rating,
      metadata: {
        placeId: body.placeId,
        category: body.category,
        notes: body.notes,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    });

    void notifyN8nEvent("mobility-events", {
      event: "mobility.place-report",
      moduleId: "mobility",
      data: { ...body },
    });

    return NextResponse.json({
      ok: true,
      saved,
      message: saved
        ? "Gracias — tu reporte ayuda a la comunidad."
        : "Reporte registrado localmente. Configura Supabase para guardarlo en la nube.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al enviar reporte";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
