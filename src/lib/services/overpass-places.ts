import type {
  AccessibilityStatus,
  AccessiblePlace,
  PlaceCategory,
} from "@/types/accessible-places";

import { haversineMeters, SEARCH_RADIUS_METERS } from "@/lib/geo/places-utils";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const AMENITY_REGEX =
  "hospital|clinic|restaurant|fast_food|cafe|bank|atm|toilets|parking|marketplace|pharmacy";

function osmWheelchairToStatus(tag?: string): AccessibilityStatus {
  if (!tag) return "unverified";
  const v = tag.toLowerCase();
  if (v === "yes" || v === "designated") return "accessible";
  if (v === "limited") return "partial";
  if (v === "no") return "inaccessible";
  return "unverified";
}

function categoryFromOsm(tags: Record<string, string>): PlaceCategory {
  if (tags.shop === "mall") return "mall";
  if (tags.amenity === "hospital" || tags.amenity === "clinic") return "hospital";
  if (
    tags.amenity === "restaurant" ||
    tags.amenity === "fast_food" ||
    tags.amenity === "cafe"
  )
    return "restaurant";
  if (tags.amenity === "bank" || tags.amenity === "atm") return "bank";
  if (tags.amenity === "marketplace") return "mall";
  if (tags.amenity === "toilets") return "accessible_toilet";
  if (tags.amenity === "parking") return "accessible_parking";
  if (tags.amenity === "pharmacy") return "hospital";
  return "restaurant";
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function elementToPlace(
  el: OverpassElement,
  userLat: number,
  userLng: number,
  forceCategory?: PlaceCategory
): AccessiblePlace | null {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;

  const distanceMeters = haversineMeters(userLat, userLng, lat, lon);

  const name =
    tags.name ??
    tags["name:es"] ??
    tags.brand ??
    tags.operator ??
    null;

  if (!name) return null;

  const category = forceCategory ?? categoryFromOsm(tags);

  return {
    id: `osm-${el.type}-${el.id}`,
    name,
    category,
    latitude: lat,
    longitude: lon,
    address:
      [tags["addr:street"], tags["addr:city"], tags["addr:state"]]
        .filter(Boolean)
        .join(", ") || undefined,
    phone: tags.phone ?? tags["contact:phone"],
    accessibility: osmWheelchairToStatus(tags.wheelchair),
    source: "osm",
    distanceMeters,
    tags: tags.wheelchair ? [`silla de ruedas: ${tags.wheelchair}`] : undefined,
  };
}

function buildCombinedQuery(lat: number, lng: number, radiusMeters: number): string {
  const around = `(around:${radiusMeters},${lat},${lng})`;
  return `[out:json][timeout:25];
(
  node["amenity"~"${AMENITY_REGEX}"]${around};
  way["amenity"~"${AMENITY_REGEX}"]${around};
  node["shop"="mall"]${around};
  way["shop"="mall"]${around};
);
out center tags 100;`;
}

function buildCategoryQuery(
  lat: number,
  lng: number,
  radiusMeters: number,
  category: PlaceCategory
): string {
  const around = `(around:${radiusMeters},${lat},${lng})`;

  switch (category) {
    case "hospital":
      return `[out:json][timeout:25];
(
  node["amenity"~"hospital|clinic|pharmacy|doctors"]${around};
  way["amenity"~"hospital|clinic|pharmacy|doctors"]${around};
);
out center tags 60;`;
    case "restaurant":
      return `[out:json][timeout:25];
(
  node["amenity"~"restaurant|fast_food|cafe"]${around};
  way["amenity"~"restaurant|fast_food|cafe"]${around};
);
out center tags 60;`;
    case "bank":
      return `[out:json][timeout:25];
(
  node["amenity"~"bank|atm"]${around};
  way["amenity"~"bank|atm"]${around};
);
out center tags 40;`;
    case "mall":
      return `[out:json][timeout:25];
(
  node["shop"="mall"]${around};
  way["shop"="mall"]${around};
  node["amenity"="marketplace"]${around};
  way["amenity"="marketplace"]${around};
);
out center tags 40;`;
    case "accessible_toilet":
      return `[out:json][timeout:25];
(
  node["amenity"="toilets"]${around};
  way["amenity"="toilets"]${around};
);
out center tags 40;`;
    case "accessible_parking":
      return `[out:json][timeout:25];
(
  node["amenity"="parking"]${around};
  way["amenity"="parking"]${around};
);
out center tags 40;`;
  }
}

async function queryOverpass(query: string): Promise<OverpassElement[]> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
        cache: "no-store",
      });

      if (!response.ok) continue;

      const data = (await response.json()) as { elements?: OverpassElement[] };
      if (data.elements?.length) return data.elements;
      if (Array.isArray(data.elements)) return data.elements;
    } catch {
      continue;
    }
  }
  return [];
}

function filterByRadius(
  places: AccessiblePlace[],
  radiusMeters: number
): AccessiblePlace[] {
  return places.filter(
    (p) => p.distanceMeters != null && p.distanceMeters <= radiusMeters
  );
}

export async function fetchOsmNearby(
  lat: number,
  lng: number,
  category: PlaceCategory | "all",
  radiusMeters = SEARCH_RADIUS_METERS
): Promise<AccessiblePlace[]> {
  const query =
    category === "all"
      ? buildCombinedQuery(lat, lng, radiusMeters)
      : buildCategoryQuery(lat, lng, radiusMeters, category);

  const elements = await queryOverpass(query);
  const places: AccessiblePlace[] = [];

  for (const el of elements) {
    const place = elementToPlace(
      el,
      lat,
      lng,
      category === "all" ? undefined : category
    );
    if (place) places.push(place);
  }

  return filterByRadius(places, radiusMeters);
}
