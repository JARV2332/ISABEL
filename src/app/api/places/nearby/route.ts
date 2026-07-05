import { NextResponse, type NextRequest } from "next/server";

import { findNearbyAccessiblePlaces } from "@/lib/services/accessible-places";
import type { PlaceCategory } from "@/types/accessible-places";

const VALID_CATEGORIES = new Set<string>([
  "all",
  "hospital",
  "restaurant",
  "bank",
  "mall",
  "accessible_toilet",
  "accessible_parking",
]);

/** GET /api/places/nearby?lat=&lng=&category=hospital&radius=12000 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const category = (searchParams.get("category") ?? "all") as PlaceCategory | "all";
    const radius = Number(searchParams.get("radius") ?? "12000");

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
      radiusMeters: Number.isFinite(radius) ? radius : 12000,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al buscar lugares";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
