import type {
  AccessibilityStatus,
  AccessiblePlace,
  PlaceCategory,
} from "@/types/accessible-places";

import { haversineMeters } from "@/lib/geo/places-utils";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const CATEGORY_OSM: Record<
  PlaceCategory,
  { amenities: string[]; extraTags?: string[] }
> = {
  hospital: { amenities: ["hospital", "clinic"] },
  restaurant: { amenities: ["restaurant", "fast_food", "cafe"] },
  bank: { amenities: ["bank", "atm"] },
  mall: { amenities: ["marketplace"] },
  accessible_toilet: { amenities: [], extraTags: ['["amenity"="toilets"]'] },
  accessible_parking: {
    amenities: [],
    extraTags: ['["amenity"="parking"]["access"~".*"]'],
  },
};

function osmWheelchairToStatus(tag?: string): AccessibilityStatus {
  if (!tag) return "unverified";
  const v = tag.toLowerCase();
  if (v === "yes" || v === "designated") return "accessible";
  if (v === "limited") return "partial";
  if (v === "no") return "inaccessible";
  return "unverified";
}

function categoryFromOsm(tags: Record<string, string>): PlaceCategory {
  if (tags.amenity === "hospital" || tags.amenity === "clinic") return "hospital";
  if (tags.amenity === "restaurant" || tags.amenity === "fast_food" || tags.amenity === "cafe")
    return "restaurant";
  if (tags.amenity === "bank" || tags.amenity === "atm") return "bank";
  if (tags.amenity === "marketplace") return "mall";
  if (tags.amenity === "toilets") return "accessible_toilet";
  if (tags.amenity === "parking") return "accessible_parking";
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

function elementToPlace(el: OverpassElement, userLat: number, userLng: number): AccessiblePlace | null {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;

  const name =
    tags.name ??
    tags["name:es"] ??
    tags.operator ??
    tags.amenity ??
    "Lugar sin nombre";

  const category = categoryFromOsm(tags);

  return {
    id: `osm-${el.type}-${el.id}`,
    name,
    category,
    latitude: lat,
    longitude: lon,
    address: [tags["addr:street"], tags["addr:city"], tags["addr:country"]]
      .filter(Boolean)
      .join(", ") || undefined,
    phone: tags.phone ?? tags["contact:phone"],
    accessibility: osmWheelchairToStatus(tags.wheelchair),
    source: "osm",
    distanceMeters: haversineMeters(userLat, userLng, lat, lon),
    tags: tags.wheelchair ? [`silla de ruedas: ${tags.wheelchair}`] : undefined,
  };
}

function buildOverpassQuery(
  lat: number,
  lng: number,
  radiusMeters: number,
  category: PlaceCategory
): string {
  const cfg = CATEGORY_OSM[category];
  const around = `(around:${radiusMeters},${lat},${lng})`;

  if (category === "accessible_toilet") {
    return `[out:json][timeout:20];
(
  node["amenity"="toilets"]${around};
  way["amenity"="toilets"]${around};
);
out center tags 30;`;
  }

  if (category === "accessible_parking") {
    return `[out:json][timeout:20];
(
  node["amenity"="parking"]${around};
  way["amenity"="parking"]${around};
);
out center tags 30;`;
  }

  const amenityFilter = cfg.amenities
    .map((a) => `  node["amenity"="${a}"]${around};\n  way["amenity"="${a}"]${around};`)
    .join("\n");

  return `[out:json][timeout:20];
(
${amenityFilter}
);
out center tags 40;`;
}

export async function fetchOsmNearby(
  lat: number,
  lng: number,
  category: PlaceCategory,
  radiusMeters = 8000
): Promise<AccessiblePlace[]> {
  const query = buildOverpassQuery(lat, lng, radiusMeters, category);

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    next: { revalidate: 3600 },
  });

  if (!response.ok) return [];

  const data = (await response.json()) as { elements?: OverpassElement[] };
  const places: AccessiblePlace[] = [];

  for (const el of data.elements ?? []) {
    const place = elementToPlace(el, lat, lng);
    if (place) places.push(place);
  }

  return places;
}
