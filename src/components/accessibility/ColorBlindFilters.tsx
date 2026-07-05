"use client";

import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";

/** Filtros SVG para simulación daltónica en toda la UI. */
export function ColorBlindFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      className="pointer-events-none absolute"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="a11y-protanopia">
          <feColorMatrix
            type="matrix"
            values="0.567 0.433 0 0 0
                    0.558 0.442 0 0 0
                    0 0.242 0.758 0 0
                    0 0 0 1 0"
          />
        </filter>
        <filter id="a11y-deuteranopia">
          <feColorMatrix
            type="matrix"
            values="0.625 0.375 0 0 0
                    0.7 0.3 0 0 0
                    0 0.3 0.7 0 0
                    0 0 0 1 0"
          />
        </filter>
        <filter id="a11y-tritanopia">
          <feColorMatrix
            type="matrix"
            values="0.95 0.05 0 0 0
                    0 0.433 0.567 0 0
                    0 0.475 0.525 0 0
                    0 0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  );
}

export function ImmersiveReaderBanner() {
  const { immersiveReader, labels } = useAccessibility();

  if (!immersiveReader) return null;

  return (
    <div
      className="immersive-reader-banner fixed inset-x-0 top-0 z-[9990] border-b-4 border-yellow-400 bg-black px-4 py-3 text-center text-lg font-bold text-yellow-300 shadow-lg"
      role="status"
      aria-live="polite"
    >
      <p>{labels.readerActive}</p>
      <p className="mt-1 text-sm font-normal text-yellow-100/90">
        {labels.readerHint}
      </p>
    </div>
  );
}
