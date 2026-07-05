"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ui/toast";
import {
  GUATEMALA_CENTER,
  SEARCH_RADIUS_METERS,
  SEARCH_RADIUS_KM,
} from "@/lib/geo/places-utils";
import type {
  AccessibilityStatus,
  AccessiblePlace,
  PlaceCategory,
  PlaceReportInput,
} from "@/types/accessible-places";

interface UserLocation {
  latitude: number;
  longitude: number;
  label: string;
}

const LOCAL_REPORTS_KEY = "isabel-mobility-reports";

function loadLocalReports(): PlaceReportInput[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    return raw ? (JSON.parse(raw) as PlaceReportInput[]) : [];
  } catch {
    return [];
  }
}

function saveLocalReport(report: PlaceReportInput) {
  const existing = loadLocalReports();
  existing.unshift(report);
  localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(existing.slice(0, 50)));
}

function applyLocalReports(places: AccessiblePlace[]): AccessiblePlace[] {
  const reports = loadLocalReports();
  if (reports.length === 0) return places;

  return places.map((place) => {
    const placeReports = reports.filter((r) => r.placeId === place.id);
    if (placeReports.length === 0) return place;

    const votes = { accessible: 0, partial: 0, inaccessible: 0 };
    for (const r of placeReports) {
      if (r.rating === "accessible") votes.accessible += 1;
      else if (r.rating === "partial") votes.partial += 1;
      else votes.inaccessible += 1;
    }

    const total = votes.accessible + votes.partial + votes.inaccessible;
    let accessibility: AccessibilityStatus = place.accessibility;
    const max = Math.max(votes.accessible, votes.partial, votes.inaccessible);
    if (votes.accessible === max && votes.accessible >= total * 0.5)
      accessibility = "accessible";
    else if (votes.inaccessible === max && votes.inaccessible >= total * 0.5)
      accessibility = "inaccessible";
    else if (total > 0) accessibility = "partial";

    return {
      ...place,
      accessibility,
      reportCount: (place.reportCount ?? 0) + placeReports.length,
      source: "community",
      notes: placeReports[0]?.notes ?? place.notes,
    };
  });
}

export function useAccessiblePlaces() {
  const { toast } = useToast();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [places, setPlaces] = useState<AccessiblePlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<AccessiblePlace | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [inGuatemala, setInGuatemala] = useState(true);
  const [locationLabel, setLocationLabel] = useState("Guatemala");
  const [searchRadiusKm, setSearchRadiusKm] = useState(SEARCH_RADIUS_KM);
  const hasAutoLocated = useRef(false);

  const searchNearby = useCallback(
    async (lat: number, lng: number, cat: PlaceCategory | "all") => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          category: cat,
          radius: String(SEARCH_RADIUS_METERS),
        });
        const response = await fetch(`/api/places/nearby?${params}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          places?: AccessiblePlace[];
          inGuatemala?: boolean;
          locationLabel?: string;
          searchRadiusKm?: number;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Error al buscar lugares");
        }

        const merged = applyLocalReports(data.places ?? []);
        setPlaces(merged);
        setInGuatemala(data.inGuatemala ?? true);
        setLocationLabel(data.locationLabel ?? "Guatemala");
        setSearchRadiusKm(data.searchRadiusKm ?? SEARCH_RADIUS_KM);
      } catch (err) {
        toast({
          title: "Búsqueda",
          description:
            err instanceof Error ? err.message : "No se pudieron cargar lugares",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    },
    [toast]
  );

  const detectLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización.");
      setLocation({
        latitude: GUATEMALA_CENTER.latitude,
        longitude: GUATEMALA_CENTER.longitude,
        label: GUATEMALA_CENTER.label,
      });
      setIsLocating(false);
      await searchNearby(
        GUATEMALA_CENTER.latitude,
        GUATEMALA_CENTER.longitude,
        category
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: "Tu ubicación actual",
        };
        setLocation(loc);
        setIsLocating(false);
        await searchNearby(loc.latitude, loc.longitude, category);
      },
      async () => {
        setLocationError(
          "No pudimos obtener tu ubicación. Mostrando Ciudad de Guatemala."
        );
        setLocation({
          latitude: GUATEMALA_CENTER.latitude,
          longitude: GUATEMALA_CENTER.longitude,
          label: GUATEMALA_CENTER.label,
        });
        setIsLocating(false);
        await searchNearby(
          GUATEMALA_CENTER.latitude,
          GUATEMALA_CENTER.longitude,
          category
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, [category, searchNearby]);

  useEffect(() => {
    if (location) {
      void searchNearby(location.latitude, location.longitude, category);
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasAutoLocated.current) return;
    hasAutoLocated.current = true;
    void detectLocation();
  }, [detectLocation]);

  const submitReport = useCallback(
    async (report: PlaceReportInput) => {
      saveLocalReport(report);

      try {
        const response = await fetch("/api/places/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(report),
        });
        const data = (await response.json()) as { message?: string; ok?: boolean };
        toast({
          title: "Reporte enviado",
          description: data.message ?? "Gracias por ayudar a la comunidad.",
          variant: "success",
        });
      } catch {
        toast({
          title: "Reporte guardado",
          description: "Se guardó en este dispositivo.",
          variant: "success",
        });
      }

      if (location) {
        await searchNearby(location.latitude, location.longitude, category);
      }
      if (selectedPlace?.id === report.placeId) {
        setSelectedPlace((prev) =>
          prev
            ? {
                ...prev,
                accessibility: report.rating,
                reportCount: (prev.reportCount ?? 0) + 1,
                notes: report.notes ?? prev.notes,
                source: "community",
              }
            : null
        );
      }
    },
    [category, location, searchNearby, selectedPlace?.id, toast]
  );

  return {
    location,
    locationError,
    isLocating,
    isSearching,
    category,
    setCategory,
    places,
    selectedPlace,
    setSelectedPlace,
    inGuatemala,
    locationLabel,
    searchRadiusKm,
    detectLocation,
    searchNearby,
    submitReport,
  };
}
