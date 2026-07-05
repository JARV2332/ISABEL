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
  icon: typeof Hospital;
}[] = [
  { id: "all", label: "Todos", icon: MapPin },
  { id: "hospital", label: "Hospitales", icon: Hospital },
  { id: "restaurant", label: "Restaurantes", icon: Utensils },
  { id: "bank", label: "Bancos", icon: Banknote },
  { id: "mall", label: "Centros comerciales", icon: ShoppingBag },
  { id: "accessible_toilet", label: "Baños", icon: Toilet },
  { id: "accessible_parking", label: "Parqueos", icon: ParkingCircle },
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
        "flex w-full items-start gap-4 rounded-2xl border-2 border-[var(--module-border)]",
        "bg-[var(--module-bg)] p-4 text-left transition-colors",
        "hover:border-[var(--module-accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
      )}
    >
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-xl text-[var(--module-accent)]"
        style={{ background: "var(--module-muted)" }}
      >
        <CategoryIcon category={place.category} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-[var(--module-fg)]">{place.name}</h3>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-bold",
              ACCESSIBILITY_COLORS[place.accessibility]
            )}
          >
            {ACCESSIBILITY_LABELS[place.accessibility]}
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--module-muted-fg)]">
          {PLACE_CATEGORY_LABELS[place.category]}
          {place.distanceMeters != null && (
            <> · {formatDistance(place.distanceMeters)}</>
          )}
          {place.reportCount ? <> · {place.reportCount} reporte(s)</> : null}
        </p>
        {place.address && (
          <p className="mt-1 truncate text-sm text-[var(--module-muted-fg)]">
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

  const handleReport = async (
    rating: PlaceReportInput["rating"]
  ) => {
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
    <div className="space-y-5 rounded-[2rem] border-2 border-[var(--module-accent)] bg-[var(--module-bg)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-sm font-bold",
              ACCESSIBILITY_COLORS[place.accessibility]
            )}
          >
            {ACCESSIBILITY_LABELS[place.accessibility]}
          </span>
          <h3 className="mt-2 text-2xl font-extrabold text-[var(--module-fg)]">
            {place.name}
          </h3>
          <p className="text-base text-[var(--module-muted-fg)]">
            {PLACE_CATEGORY_LABELS[place.category]}
            {place.distanceMeters != null && (
              <> · a {formatDistance(place.distanceMeters)} de ti</>
            )}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      {place.address && (
        <p className="flex items-start gap-2 text-base text-[var(--module-fg)]">
          <MapPin className="mt-0.5 size-5 shrink-0 text-[var(--module-accent)]" />
          {place.address}
        </p>
      )}

      {place.notes && (
        <p className="rounded-xl bg-[var(--module-muted)] p-3 text-sm text-[var(--module-fg)]">
          {place.notes}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="human-press inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--module-accent)] px-4 text-base font-bold text-[var(--module-accent-fg)]"
        >
          <Navigation aria-hidden="true" />
          Ruta en Google Maps
        </a>

        {place.phone && (
          <a
            href={`tel:${place.phone.replace(/\s/g, "")}`}
            className="human-press inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[var(--module-border)] px-4 text-base font-bold text-[var(--module-fg)]"
          >
            <Phone aria-hidden="true" />
            Llamar
          </a>
        )}
      </div>

      <section
        aria-labelledby="transport-heading"
        className="rounded-2xl border-2 border-dashed border-[var(--module-border)] p-4"
      >
        <h4
          id="transport-heading"
          className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--module-fg)]"
        >
          <Car className="size-5" aria-hidden="true" />
          Transporte accesible
        </h4>
        <p className="mb-3 text-sm text-[var(--module-muted-fg)]">
          Pide Uber o InDriver y avisa al conductor que viajas en silla de ruedas.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {uberUrl && (
            <a
              href={uberUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="human-press inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-black px-4 text-sm font-bold text-white"
            >
              Pedir Uber
            </a>
          )}
          <a
            href="https://indrive.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="human-press inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-lime-500 px-4 text-sm font-bold text-black"
          >
            Abrir InDriver
          </a>
          <button
            type="button"
            onClick={() => void copyWheelchairMessage()}
            className="human-press inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[var(--module-border)] px-4 text-sm font-bold"
          >
            <Copy className="size-4" aria-hidden="true" />
            {copied ? "¡Copiado!" : "Copiar mensaje silla de ruedas"}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--module-muted-fg)]">
          «{WHEELCHAIR_RIDE_MESSAGE}»
        </p>
      </section>

      <section aria-labelledby="report-heading">
        <h4
          id="report-heading"
          className="mb-2 text-lg font-bold text-[var(--module-fg)]"
        >
          Reportar accesibilidad
        </h4>
        <p className="mb-3 text-sm text-[var(--module-muted-fg)]">
          ¿Visitaste este lugar? Ayuda a otros con tu experiencia real.
        </p>
        <textarea
          value={reportNotes}
          onChange={(e) => setReportNotes(e.target.value)}
          placeholder="Ej: Hay rampa pero el baño no es accesible…"
          rows={2}
          className="mb-3 w-full rounded-xl border-2 border-[var(--module-border)] bg-[var(--module-muted)] px-4 py-3 text-sm"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={isReporting}
            onClick={() => void handleReport("accessible")}
            className="human-press flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <ThumbsUp className="size-4" aria-hidden="true" />
            Accesible
          </button>
          <button
            type="button"
            disabled={isReporting}
            onClick={() => void handleReport("partial")}
            className="human-press flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 text-sm font-bold text-black disabled:opacity-50"
          >
            <AlertTriangle className="size-4" aria-hidden="true" />
            Parcial
          </button>
          <button
            type="button"
            disabled={isReporting}
            onClick={() => void handleReport("inaccessible")}
            className="human-press flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 text-sm font-bold text-white disabled:opacity-50"
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
    inGuatemala,
    locationLabel,
    detectLocation,
    submitReport,
  } = useAccessiblePlaces();

  return (
    <section aria-labelledby="places-heading" className="space-y-6">
      <div>
        <h2
          id="places-heading"
          className="mb-2 flex items-center gap-3 text-2xl font-extrabold text-[var(--module-fg)]"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--module-accent)] text-[var(--module-accent-fg)]">
            <MapPin className="size-6" aria-hidden="true" />
          </span>
          Lugares accesibles — Guatemala
        </h2>
        <p className="text-base leading-relaxed text-[var(--module-muted-fg)]">
          Encuentra hospitales, bancos, baños y más con rampas y acceso inclusivo.
          Usa tu ubicación para ver opciones cercanas, rutas en Maps y transporte.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          size="lg"
          className="min-h-14 flex-1 bg-[var(--module-accent)] text-[var(--module-accent-fg)]"
          onClick={() => void detectLocation()}
          disabled={isLocating || isSearching}
        >
          <MapPin aria-hidden="true" />
          {isLocating ? "Detectando ubicación…" : "¿Dónde estoy? Buscar cerca"}
        </Button>
        {location && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-14"
            onClick={() => void detectLocation()}
            disabled={isLocating || isSearching}
            aria-label="Actualizar búsqueda"
          >
            <RefreshCw className={cn(isSearching && "animate-spin")} aria-hidden="true" />
          </Button>
        )}
      </div>

      {location && (
        <p className="flex items-center gap-2 text-sm font-medium text-[var(--module-fg)]" role="status">
          <Accessibility className="size-4 text-[var(--module-accent)]" />
          {location.label} · {locationLabel}
          {!inGuatemala && " — datos de referencia Guatemala"}
        </p>
      )}

      {locationError && (
        <p role="alert" className="text-sm font-medium text-amber-700">
          {locationError}
        </p>
      )}

      <div
        role="group"
        aria-label="Filtrar por tipo de lugar"
        className="flex flex-wrap gap-2"
      >
        {CATEGORY_OPTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            aria-pressed={category === id}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition-colors",
              category === id
                ? "border-[var(--module-accent)] bg-[var(--module-accent)] text-[var(--module-accent-fg)]"
                : "border-[var(--module-border)] text-[var(--module-fg)] hover:border-[var(--module-accent)]"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
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
        <div className="space-y-3" role="list" aria-label="Lugares cercanos">
          {!location && !isLocating && (
            <p className="rounded-2xl border-2 border-dashed border-[var(--module-border)] p-6 text-center text-[var(--module-muted-fg)]">
              Toca «¿Dónde estoy?» para ver lugares accesibles cerca de ti en
              Guatemala.
            </p>
          )}

          {isSearching && (
            <p className="text-center text-[var(--module-muted-fg)]" aria-live="polite">
              Buscando lugares accesibles…
            </p>
          )}

          {places.map((place) => (
            <div key={place.id} role="listitem">
              <PlaceCard place={place} onSelect={setSelectedPlace} />
            </div>
          ))}

          {location && !isSearching && places.length === 0 && (
            <p className="text-center text-[var(--module-muted-fg)]">
              No encontramos lugares en esta categoría cerca. Prueba otra categoría
              o amplía la búsqueda.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
