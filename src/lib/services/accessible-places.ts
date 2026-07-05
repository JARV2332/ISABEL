import { filterSeedByCategory, GUATEMALA_SEED_PLACES } from "@/lib/data/guatemala-places-seed";
import {
  fetchReverseGeocodeLabel,
  haversineMeters,
  isInGuatemala,
  SEARCH_RADIUS_METERS,
} from "@/lib/geo/places-utils";
import { fetchOsmNearby } from "@/lib/services/overpass-places";
import { fetchPhotonNearby } from "@/lib/services/photon-places";
import {
  createSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/services/interactions";
import type {
  AccessibilityStatus,
  AccessiblePlace,
  PlaceCategory,
  PlaceReportInput,
} from "@/types/accessible-places";

interface ReportRow {
  place_id: string;
  rating: string;
  notes: string | null;
}

function rankStatus(status: AccessibilityStatus): number {
  switch (status) {
    case "accessible":
      return 4;
    case "partial":
      return 3;
    case "unverified":
      return 2;
    case "inaccessible":
      return 1;
    default:
      return 0;
  }
}

function mergeStatus(
  base: AccessibilityStatus,
  votes: { accessible: number; partial: number; inaccessible: number }
): AccessibilityStatus {
  const total = votes.accessible + votes.partial + votes.inaccessible;
  if (total === 0) return base;

  const max = Math.max(votes.accessible, votes.partial, votes.inaccessible);
  if (votes.accessible === max && votes.accessible >= total * 0.5) return "accessible";
  if (votes.inaccessible === max && votes.inaccessible >= total * 0.5)
    return "inaccessible";
  if (votes.partial > 0 || votes.accessible > 0) return "partial";
  return base;
}

async function fetchReportVotes(
  placeIds: string[]
): Promise<
  Map<
    string,
    {
      accessible: number;
      partial: number;
      inaccessible: number;
      count: number;
      lastNote?: string;
    }
  >
> {
  const map = new Map<
    string,
    {
      accessible: number;
      partial: number;
      inaccessible: number;
      count: number;
      lastNote?: string;
    }
  >();

  if (!isSupabaseConfigured() || placeIds.length === 0) return map;

  try {
    const supabase = createSupabaseClient();
    const { data } = await supabase
      .from("accessibility_reports")
      .select("place_id, rating, notes")
      .in("place_id", placeIds.slice(0, 100));

    for (const row of (data ?? []) as ReportRow[]) {
      const current = map.get(row.place_id) ?? {
        accessible: 0,
        partial: 0,
        inaccessible: 0,
        count: 0,
      };
      if (row.rating === "accessible") current.accessible += 1;
      else if (row.rating === "partial") current.partial += 1;
      else if (row.rating === "inaccessible") current.inaccessible += 1;
      current.count += 1;
      if (row.notes) current.lastNote = row.notes;
      map.set(row.place_id, current);
    }
  } catch {
    /* fallback sin reportes */
  }

  return map;
}

function dedupePlaces(places: AccessiblePlace[]): AccessiblePlace[] {
  const seen = new Map<string, AccessiblePlace>();

  for (const place of places) {
    const key = `${place.name.toLowerCase().slice(0, 40)}-${place.latitude.toFixed(4)}-${place.longitude.toFixed(4)}`;
    const existing = seen.get(key);
    if (
      !existing ||
      rankStatus(place.accessibility) > rankStatus(existing.accessibility)
    ) {
      seen.set(key, place);
    }
  }

  return Array.from(seen.values());
}

function seedWithinRadius(
  latitude: number,
  longitude: number,
  category: PlaceCategory | "all",
  radiusMeters: number
): AccessiblePlace[] {
  const pool =
    category === "all" ? GUATEMALA_SEED_PLACES : filterSeedByCategory(category);

  return pool
    .map((p) => ({
      ...p,
      distanceMeters: haversineMeters(latitude, longitude, p.latitude, p.longitude),
    }))
    .filter((p) => (p.distanceMeters ?? 0) <= radiusMeters);
}

export async function findNearbyAccessiblePlaces(options: {
  latitude: number;
  longitude: number;
  category: PlaceCategory | "all";
  radiusMeters?: number;
  includeOsm?: boolean;
}): Promise<{
  places: AccessiblePlace[];
  /** true si hay lugares curados extra de Guatemala en el resultado */
  hasCuratedSeed: boolean;
  locationLabel: string;
  searchRadiusMeters: number;
  searchRadiusKm: number;
}> {
  const {
    latitude,
    longitude,
    category,
    radiusMeters = SEARCH_RADIUS_METERS,
    includeOsm = true,
  } = options;

  const inGt = isInGuatemala(latitude, longitude);

  // OpenStreetMap cubre todo el mundo; seed curado solo en Guatemala.
  let combined: AccessiblePlace[] = inGt
    ? seedWithinRadius(latitude, longitude, category, radiusMeters)
    : [];

  if (includeOsm) {
    const [photon, osm] = await Promise.allSettled([
      fetchPhotonNearby(latitude, longitude, category, radiusMeters),
      fetchOsmNearby(latitude, longitude, category, radiusMeters),
    ]);

    if (photon.status === "fulfilled") combined.push(...photon.value);
    if (osm.status === "fulfilled") combined.push(...osm.value);
  }

  combined = dedupePlaces(combined)
    .filter((p) => (p.distanceMeters ?? Infinity) <= radiusMeters)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));

  const ids = combined.map((p) => p.id);
  const votes = await fetchReportVotes(ids);

  combined = combined.map((place) => {
    const v = votes.get(place.id);
    if (!v) return place;
    return {
      ...place,
      accessibility: mergeStatus(place.accessibility, v),
      reportCount: v.count,
      notes: v.lastNote ?? place.notes,
      source: v.count > 0 ? "community" : place.source,
    };
  });

  const locationLabel = await fetchReverseGeocodeLabel(latitude, longitude);
  const hasCuratedSeed = inGt && combined.some((p) => p.source === "seed");

  return {
    places: combined.slice(0, 50),
    hasCuratedSeed,
    locationLabel,
    searchRadiusMeters: radiusMeters,
    searchRadiusKm: Math.round(radiusMeters / 1000),
  };
}

export async function submitPlaceReport(input: PlaceReportInput): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("accessibility_reports").insert({
      place_id: input.placeId,
      place_name: input.placeName,
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address ?? null,
      phone: input.phone ?? null,
      rating: input.rating,
      notes: input.notes ?? null,
    });

    return !error;
  } catch {
    return false;
  }
}

export { GUATEMALA_SEED_PLACES };
