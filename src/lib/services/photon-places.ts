import type {
  AccessibilityStatus,
  AccessiblePlace,
  PlaceCategory,
} from "@/types/accessible-places";

import { haversineMeters, SEARCH_RADIUS_METERS } from "@/lib/geo/places-utils";

const PHOTON_URL = "https://photon.komoot.io/api/";

const CATEGORY_QUERIES: Record<PlaceCategory, string[]> = {
  hospital: ["hospital", "clinic", "pharmacy", "doctor"],
  restaurant: ["restaurant", "cafe", "fast food"],
  bank: ["bank", "atm"],
  mall: ["shopping mall", "supermarket", "marketplace"],
  accessible_toilet: ["public toilet", "toilets"],
  accessible_parking: ["parking"],
};

const ALL_QUERIES = [
  "hospital",
  "restaurant",
  "bank",
  "pharmacy",
  "supermarket",
  "parking",
  "cafe",
];

interface PhotonFeature {
  type: string;
  geometry?: { type: string; coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    type?: string;
  };
}

function photonCategoryFromProps(
  props: NonNullable<PhotonFeature["properties"]>
): PlaceCategory {
  const key = props.osm_key ?? "";
  const val = props.osm_value ?? "";

  if (val === "hospital" || val === "clinic" || val === "pharmacy" || val === "doctors")
    return "hospital";
  if (val === "restaurant" || val === "fast_food" || val === "cafe") return "restaurant";
  if (val === "bank" || val === "atm") return "bank";
  if (val === "mall" || val === "marketplace" || val === "supermarket") return "mall";
  if (val === "toilets") return "accessible_toilet";
  if (val === "parking") return "accessible_parking";
  if (key === "shop" && val === "mall") return "mall";
  return "restaurant";
}

function featureToPlace(
  feature: PhotonFeature,
  userLat: number,
  userLng: number,
  forceCategory?: PlaceCategory
): AccessiblePlace | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const [lon, lat] = coords;
  const props = feature.properties ?? {};
  const distanceMeters = haversineMeters(userLat, userLng, lat, lon);

  const name =
    props.name ??
    (props.osm_value
      ? `${props.osm_value.charAt(0).toUpperCase()}${props.osm_value.slice(1).replace(/_/g, " ")}`
      : null);

  if (!name) return null;

  const category = forceCategory ?? photonCategoryFromProps(props);
  const address = [props.street, props.city, props.state, props.country]
    .filter(Boolean)
    .join(", ");

  return {
    id: `photon-${props.osm_type ?? "x"}-${props.osm_id ?? `${lat}-${lon}`}`,
    name,
    category,
    latitude: lat,
    longitude: lon,
    address: address || undefined,
    accessibility: "unverified" as AccessibilityStatus,
    source: "osm",
    distanceMeters,
  };
}

async function searchPhoton(
  query: string,
  lat: number,
  lng: number,
  limit = 20
): Promise<PhotonFeature[]> {
  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", "es");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = (await response.json()) as { features?: PhotonFeature[] };
  return data.features ?? [];
}

function filterByRadius(
  places: AccessiblePlace[],
  radiusMeters: number
): AccessiblePlace[] {
  return places.filter(
    (p) => p.distanceMeters != null && p.distanceMeters <= radiusMeters
  );
}

/** Búsqueda worldwide vía Photon (Komoot/OSM) — muy fiable sin API key. */
export async function fetchPhotonNearby(
  lat: number,
  lng: number,
  category: PlaceCategory | "all",
  radiusMeters = SEARCH_RADIUS_METERS
): Promise<AccessiblePlace[]> {
  const queries =
    category === "all"
      ? ALL_QUERIES
      : CATEGORY_QUERIES[category] ?? [category];

  const results = await Promise.all(
    queries.map((q) => searchPhoton(q, lat, lng, 25))
  );

  const places: AccessiblePlace[] = [];

  for (const features of results) {
    for (const feature of features) {
      const place = featureToPlace(
        feature,
        lat,
        lng,
        category === "all" ? undefined : category
      );
      if (place) places.push(place);
    }
  }

  return filterByRadius(places, radiusMeters);
}
