import { NextResponse } from "next/server";

import {
  fetchRecentInteractions,
  fetchRecentIotEvents,
} from "@/lib/services/interactions";

export async function GET() {
  try {
    const [interactions, iotEvents] = await Promise.all([
      fetchRecentInteractions(10),
      fetchRecentIotEvents(5),
    ]);

    return NextResponse.json({ interactions, iotEvents });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al cargar interacciones";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
