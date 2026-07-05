export type PlaceCategory =
  | "hospital"
  | "restaurant"
  | "bank"
  | "mall"
  | "accessible_toilet"
  | "accessible_parking";

export type AccessibilityStatus =
  | "accessible"
  | "partial"
  | "inaccessible"
  | "unverified";

export interface AccessiblePlace {
  id: string;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  accessibility: AccessibilityStatus;
  source: "seed" | "osm" | "community";
  distanceMeters?: number;
  reportCount?: number;
  notes?: string;
  tags?: string[];
}

export interface PlaceReportInput {
  placeId: string;
  placeName: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  rating: Exclude<AccessibilityStatus, "unverified">;
  notes?: string;
}

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  hospital: "Hospital",
  restaurant: "Restaurante",
  bank: "Banco",
  mall: "Centro comercial",
  accessible_toilet: "Baño accesible",
  accessible_parking: "Parqueo accesible",
};

export const ACCESSIBILITY_LABELS: Record<AccessibilityStatus, string> = {
  accessible: "Accesible",
  partial: "Parcialmente accesible",
  inaccessible: "No accesible",
  unverified: "Sin verificar",
};

export const ACCESSIBILITY_COLORS: Record<AccessibilityStatus, string> = {
  accessible: "bg-emerald-600 text-white",
  partial: "bg-amber-500 text-black",
  inaccessible: "bg-red-600 text-white",
  unverified: "bg-slate-500 text-white",
};
