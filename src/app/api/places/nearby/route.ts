import { NextResponse, type NextRequest } from "next/server";

import { findNearbyAccessiblePlaces } from "@/lib/services/accessible-places";
import { SEARCH_RADIUS_METERS } from "@/lib/geo/places-utils";
import type { PlaceCategory } from "@/types/accessible-places";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set<string>([
  "all",
  "hospital",
  "restaurant",
  "bank",
  "mall",
  "accessible_toilet",
  "accessible_parking",
]);

/** GET /api/places/nearby?lat=&lng=&category=hospital&radius=15000 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const category = (searchParams.get("category") ?? "all") as PlaceCategory | "all";
    const radius = Number(searchParams.get("radius") ?? String(SEARCH_RADIUS_METERS));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "Parámetros lat y lng requeridos" },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
    }

    const result = await findNearbyAccessiblePlaces({
      latitude: lat,
      longitude: lng,
      category,
      radiusMeters: Number.isFinite(radius) ? radius : SEARCH_RADIUS_METERS,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al buscar lugares";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
