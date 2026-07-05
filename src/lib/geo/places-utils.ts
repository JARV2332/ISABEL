/** Utilidades geográficas para lugares accesibles. */

/** Radio de búsqueda: 15 km a la redonda desde la ubicación del usuario. */
export const SEARCH_RADIUS_METERS = 15_000;
export const SEARCH_RADIUS_KM = 15;

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function googleMapsDirectionsUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
}

export function googleMapsPlaceUrl(lat: number, lng: number, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=&center=${lat},${lng}&zoom=16`;
}

export function uberDeepLink(
  pickupLat: number,
  pickupLng: number,
  destLat: number,
  destLng: number,
  destName: string
): string {
  const params = new URLSearchParams({
    pickup: "my_location",
    "drop[0]": `${destLat},${destLng}`,
    "drop[0].nickname": destName.slice(0, 50),
  });
  return `https://m.uber.com/looking?${params.toString()}`;
}

/** InDriver no expone deep link estable; abrimos la app/web con destino en portapapeles vía UI. */
export const WHEELCHAIR_RIDE_MESSAGE =
  "Hola, soy una persona en silla de ruedas. Necesito un vehículo con espacio para silla plegable o acceso accesible. ¿Puede ayudarme?";

export const GUATEMALA_CENTER = {
  latitude: 14.6349,
  longitude: -90.5069,
  label: "Ciudad de Guatemala",
};

export function isInGuatemala(lat: number, lng: number): boolean {
  return lat >= 13.5 && lat <= 17.9 && lng >= -92.5 && lng <= -88.0;
}

/** Ciudad/país a partir de coordenadas (OpenStreetMap Nominatim). Funciona worldwide. */
export async function fetchReverseGeocodeLabel(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");
    url.searchParams.set("zoom", "10");
    url.searchParams.set("accept-language", "es");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "ISABEL-Accessibility/1.0 (mobility-places)" },
      cache: "no-store",
    });

    if (!response.ok) return "Tu ubicación";

    const data = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };

    const addr = data.address ?? {};
    const city =
      addr.city ??
      addr.town ??
      addr.village ??
      addr.municipality ??
      addr.county ??
      addr.state;
    const country = addr.country;

    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    if (data.display_name) {
      return data.display_name.split(",").slice(0, 2).join(",").trim();
    }
    return "Tu ubicación";
  } catch {
    return "Tu ubicación";
  }
}
