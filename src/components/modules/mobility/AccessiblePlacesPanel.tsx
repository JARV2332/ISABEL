"use client";

import {
  Accessibility,
  Banknote,
  Car,
  Copy,
  Hospital,
  MapPin,
  Navigation,
  ParkingCircle,
  Phone,
  RefreshCw,
  ShoppingBag,
  ThumbsDown,
  ThumbsUp,
  Toilet,
  Utensils,
  AlertTriangle,
} from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAccessiblePlaces } from "@/lib/hooks/useAccessiblePlaces";
import {
  formatDistance,
  googleMapsDirectionsUrl,
  uberDeepLink,
  WHEELCHAIR_RIDE_MESSAGE,
} from "@/lib/geo/places-utils";
import { cn } from "@/lib/utils";
import {
  ACCESSIBILITY_COLORS,
  ACCESSIBILITY_LABELS,
  PLACE_CATEGORY_LABELS,
  type AccessiblePlace,
  type PlaceCategory,
  type PlaceReportInput,
} from "@/types/accessible-places";

const CATEGORY_OPTIONS: {
  id: PlaceCategory | "all";
  label: string;
  shortLabel: string;
  icon: typeof Hospital;
}[] = [
  { id: "all", label: "Todos", shortLabel: "Todos", icon: MapPin },
  { id: "hospital", label: "Hospitales", shortLabel: "Hospit.", icon: Hospital },
  { id: "restaurant", label: "Restaurantes", shortLabel: "Comida", icon: Utensils },
  { id: "bank", label: "Bancos", shortLabel: "Bancos", icon: Banknote },
  { id: "mall", label: "Centros comerciales", shortLabel: "Malls", icon: ShoppingBag },
  { id: "accessible_toilet", label: "Baños accesibles", shortLabel: "Baños", icon: Toilet },
  { id: "accessible_parking", label: "Parqueos", shortLabel: "Parqueo", icon: ParkingCircle },
];

function CategoryIcon({ category }: { category: PlaceCategory }) {
  const map = {
    hospital: Hospital,
    restaurant: Utensils,
    bank: Banknote,
    mall: ShoppingBag,
    accessible_toilet: Toilet,
    accessible_parking: ParkingCircle,
  } as const;
  const Icon = map[category] ?? MapPin;
  return <Icon className="size-5 shrink-0" aria-hidden="true" />;
}

function PlaceCard({
  place,
  onSelect,
}: {
  place: AccessiblePlace;
  onSelect: (p: AccessiblePlace) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border-2 border-[var(--module-border)]",
        "bg-[var(--module-bg)] p-3 text-left transition-colors sm:gap-4 sm:p-4",
        "hover:border-[var(--module-accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
      )}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[var(--module-accent)] sm:size-12"
        style={{ background: "var(--module-muted)" }}
      >
        <CategoryIcon category={place.category} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <h3 className="text-base font-bold leading-snug text-[var(--module-fg)] sm:text-lg">
            {place.name}
          </h3>
          <span
            className={cn(
              "w-fit rounded-full px-2.5 py-0.5 text-xs font-bold",
              ACCESSIBILITY_COLORS[place.accessibility]
            )}
          >
            {ACCESSIBILITY_LABELS[place.accessibility]}
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--module-muted-fg)] sm:text-sm">
          {PLACE_CATEGORY_LABELS[place.category]}
          {place.distanceMeters != null && (
            <> · {formatDistance(place.distanceMeters)}</>
          )}
          {place.reportCount ? <> · {place.reportCount} reporte(s)</> : null}
        </p>
        {place.address && (
          <p className="mt-1 line-clamp-2 text-xs text-[var(--module-muted-fg)] sm:text-sm">
            {place.address}
          </p>
        )}
      </div>
    </button>
  );
}

function PlaceDetail({
  place,
  userLat,
  userLng,
  onClose,
  onReport,
}: {
  place: AccessiblePlace;
  userLat?: number;
  userLng?: number;
  onClose: () => void;
  onReport: (report: PlaceReportInput) => Promise<void>;
}) {
  const [reportNotes, setReportNotes] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const mapsUrl =
    userLat != null && userLng != null
      ? googleMapsDirectionsUrl(userLat, userLng, place.latitude, place.longitude)
      : `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;

  const uberUrl =
    userLat != null && userLng != null
      ? uberDeepLink(userLat, userLng, place.latitude, place.longitude, place.name)
      : null;

  const handleReport = async (rating: PlaceReportInput["rating"]) => {
    setIsReporting(true);
    try {
      await onReport({
        placeId: place.id,
        placeName: place.name,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
        phone: place.phone,
        rating,
        notes: reportNotes.trim() || undefined,
      });
      setReportNotes("");
    } finally {
      setIsReporting(false);
    }
  };

  const copyWheelchairMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(WHEELCHAIR_RIDE_MESSAGE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="space-y-4 rounded-2xl border-2 border-[var(--module-accent)] bg-[var(--module-bg)] p-4 sm:space-y-5 sm:rounded-[2rem] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-xs font-bold sm:text-sm",
              ACCESSIBILITY_COLORS[place.accessibility]
            )}
          >
            {ACCESSIBILITY_LABELS[place.accessibility]}
          </span>
          <h3 className="mt-2 text-xl font-extrabold leading-tight text-[var(--module-fg)] sm:text-2xl">
            {place.name}
          </h3>
          <p className="text-sm text-[var(--module-muted-fg)] sm:text-base">
            {PLACE_CATEGORY_LABELS[place.category]}
            {place.distanceMeters != null && (
              <> · a {formatDistance(place.distanceMeters)} de ti</>
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </div>

      {place.address && (
        <p className="flex items-start gap-2 text-sm text-[var(--module-fg)] sm:text-base">
          <MapPin className="mt-0.5 size-5 shrink-0 text-[var(--module-accent)]" />
          <span className="break-words">{place.address}</span>
        </p>
      )}

      {place.notes && (
        <p className="rounded-xl bg-[var(--module-muted)] p-3 text-sm text-[var(--module-fg)]">
          {place.notes}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 xs:grid-cols-1 sm:grid-cols-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="human-press inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--module-accent)] px-4 text-sm font-bold text-[var(--module-accent-fg)] sm:min-h-14 sm:text-base"
        >
          <Navigation className="size-5 shrink-0" aria-hidden="true" />
          Ruta en Google Maps
        </a>

        {place.phone && (
          <a
            href={`tel:${place.phone.replace(/\s/g, "")}`}
            className="human-press inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-[var(--module-border)] px-4 text-sm font-bold text-[var(--module-fg)] sm:min-h-14 sm:text-base"
          >
            <Phone className="size-5 shrink-0" aria-hidden="true" />
            Llamar
          </a>
        )}
      </div>

      <section
        aria-labelledby="transport-heading"
        className="rounded-2xl border-2 border-dashed border-[var(--module-border)] p-3 sm:p-4"
      >
        <h4
          id="transport-heading"
          className="mb-2 flex items-center gap-2 text-base font-bold text-[var(--module-fg)] sm:text-lg"
        >
          <Car className="size-5 shrink-0" aria-hidden="true" />
          Transporte accesible
        </h4>
        <p className="mb-3 text-xs text-[var(--module-muted-fg)] sm:text-sm">
          Pide Uber o InDriver y avisa al conductor que viajas en silla de ruedas.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {uberUrl && (
            <a
              href={uberUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="human-press inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-black px-3 text-sm font-bold text-white"
            >
              Pedir Uber
            </a>
          )}
          <a
            href="https://indrive.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="human-press inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-lime-500 px-3 text-sm font-bold text-black"
          >
            Abrir InDriver
          </a>
          <button
            type="button"
            onClick={() => void copyWheelchairMessage()}
            className="human-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--module-border)] px-3 text-xs font-bold sm:text-sm"
          >
            <Copy className="size-4 shrink-0" aria-hidden="true" />
            {copied ? "¡Copiado!" : "Copiar mensaje"}
          </button>
        </div>
        <p className="mt-2 break-words text-xs text-[var(--module-muted-fg)]">
          «{WHEELCHAIR_RIDE_MESSAGE}»
        </p>
      </section>

      <section aria-labelledby="report-heading">
        <h4
          id="report-heading"
          className="mb-2 text-base font-bold text-[var(--module-fg)] sm:text-lg"
        >
          Reportar accesibilidad
        </h4>
        <textarea
          value={reportNotes}
          onChange={(e) => setReportNotes(e.target.value)}
          placeholder="Ej: Hay rampa pero el baño no es accesible…"
          rows={2}
          className="mb-3 w-full rounded-xl border-2 border-[var(--module-border)] bg-[var(--module-muted)] px-3 py-2.5 text-sm sm:px-4 sm:py-3"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={isReporting}
            onClick={() => void handleReport("accessible")}
            className="human-press flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <ThumbsUp className="size-4" aria-hidden="true" />
            Accesible
          </button>
          <button
            type="button"
            disabled={isReporting}
            onClick={() => void handleReport("partial")}
            className="human-press flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 text-sm font-bold text-black disabled:opacity-50"
          >
            <AlertTriangle className="size-4" aria-hidden="true" />
            Parcial
          </button>
          <button
            type="button"
            disabled={isReporting}
            onClick={() => void handleReport("inaccessible")}
            className="human-press flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <ThumbsDown className="size-4" aria-hidden="true" />
            No accesible
          </button>
        </div>
      </section>
    </div>
  );
}

export function AccessiblePlacesPanel() {
  const {
    location,
    locationError,
    isLocating,
    isSearching,
    category,
    setCategory,
    places,
    selectedPlace,
    setSelectedPlace,
    hasCuratedSeed,
    locationLabel,
    searchRadiusKm,
    detectLocation,
    submitReport,
  } = useAccessiblePlaces();

  return (
    <section aria-labelledby="places-heading" className="space-y-4 sm:space-y-6">
      <div>
        <h2
          id="places-heading"
          className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--module-accent)] text-[var(--module-accent-fg)] sm:size-12">
            <MapPin className="size-5 sm:size-6" aria-hidden="true" />
          </span>
          <span className="text-xl font-extrabold leading-tight text-[var(--module-fg)] sm:text-2xl">
            Lugares accesibles cerca de ti
          </span>
        </h2>
        <p className="text-sm leading-relaxed text-[var(--module-muted-fg)] sm:text-base">
          Usamos la ubicación de tu dispositivo para buscar hospitales, bancos,
          baños y más en un radio de{" "}
          <strong className="text-[var(--module-fg)]">{searchRadiusKm} km</strong>.
          Funciona en cualquier país.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <Button
          type="button"
          size="lg"
          className="min-h-12 w-full flex-1 bg-[var(--module-accent)] text-sm text-[var(--module-accent-fg)] sm:min-h-14 sm:text-base"
          onClick={() => void detectLocation()}
          disabled={isLocating || isSearching}
        >
          <MapPin className="size-5 shrink-0" aria-hidden="true" />
          {isLocating
            ? "Detectando ubicación…"
            : isSearching
              ? "Buscando lugares…"
              : "Buscar cerca de mí"}
        </Button>
        {location && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-12 w-full sm:min-h-14 sm:w-auto"
            onClick={() => void detectLocation()}
            disabled={isLocating || isSearching}
            aria-label="Actualizar búsqueda"
          >
            <RefreshCw
              className={cn("size-5", isSearching && "animate-spin")}
              aria-hidden="true"
            />
            <span className="sm:sr-only">Actualizar</span>
          </Button>
        )}
      </div>

      {location && (
        <div
          className="rounded-xl bg-[var(--module-muted)] px-3 py-2.5 text-xs sm:px-4 sm:text-sm"
          role="status"
        >
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-[var(--module-fg)]">
            <Accessibility className="size-4 shrink-0 text-[var(--module-accent)]" />
            <span>{locationLabel || "Detectando…"}</span>
            <span className="text-[var(--module-muted-fg)]">·</span>
            <span>Radio {searchRadiusKm} km</span>
          </p>
          {!isSearching && (
            <p className="mt-1 text-[var(--module-muted-fg)]">
              {places.length} lugar(es) encontrado(s)
              {hasCuratedSeed && " · incluye lugares verificados en Guatemala"}
            </p>
          )}
        </div>
      )}

      {locationError && (
        <p role="alert" className="text-sm font-medium text-amber-700">
          {locationError}
        </p>
      )}

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div
          role="group"
          aria-label="Filtrar por tipo de lugar"
          className="flex w-max min-w-full gap-2 sm:flex-wrap sm:w-auto"
        >
          {CATEGORY_OPTIONS.map(({ id, label, shortLabel, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              aria-pressed={category === id}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-bold transition-colors sm:min-h-11 sm:gap-2 sm:px-4 sm:text-sm",
                category === id
                  ? "border-[var(--module-accent)] bg-[var(--module-accent)] text-[var(--module-accent-fg)]"
                  : "border-[var(--module-border)] text-[var(--module-fg)] hover:border-[var(--module-accent)]"
              )}
            >
              <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedPlace ? (
        <PlaceDetail
          place={selectedPlace}
          userLat={location?.latitude}
          userLng={location?.longitude}
          onClose={() => setSelectedPlace(null)}
          onReport={submitReport}
        />
      ) : (
        <div className="space-y-2 sm:space-y-3" role="list" aria-label="Lugares cercanos">
          {(isLocating || isSearching) && !places.length && (
            <p
              className="rounded-2xl border-2 border-dashed border-[var(--module-border)] p-6 text-center text-sm text-[var(--module-muted-fg)]"
              aria-live="polite"
            >
              {isLocating
                ? "Obteniendo tu ubicación…"
                : `Buscando lugares accesibles en un radio de ${searchRadiusKm} km…`}
            </p>
          )}

          {places.map((place) => (
            <div key={place.id} role="listitem">
              <PlaceCard place={place} onSelect={setSelectedPlace} />
            </div>
          ))}

          {location && !isSearching && places.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-[var(--module-border)] p-5 text-center sm:p-6">
              <p className="text-sm text-[var(--module-fg)] sm:text-base">
                No hay lugares en un radio de {searchRadiusKm} km para esta categoría.
              </p>
              <p className="mt-2 text-xs text-[var(--module-muted-fg)] sm:text-sm">
                Prueba «Todos» u otra categoría, o toca actualizar si acabas de
                moverte.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => void detectLocation()}
              >
                Buscar de nuevo
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
