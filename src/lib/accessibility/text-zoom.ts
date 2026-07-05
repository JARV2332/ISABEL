/** Niveles de zoom de texto para lectores con baja visión. */
export const TEXT_ZOOM_LEVELS = [100, 110, 125, 150, 175, 200] as const;

export type TextZoomLevel = (typeof TEXT_ZOOM_LEVELS)[number];

export const DEFAULT_TEXT_ZOOM: TextZoomLevel = 100;

export function normalizeTextZoom(value: number): TextZoomLevel {
  const match = TEXT_ZOOM_LEVELS.find((level) => level === value);
  if (match) return match;

  const closest = TEXT_ZOOM_LEVELS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
  return closest;
}

export function stepTextZoom(
  current: TextZoomLevel,
  direction: "in" | "out"
): TextZoomLevel {
  const idx = TEXT_ZOOM_LEVELS.indexOf(current);
  if (direction === "in") {
    return TEXT_ZOOM_LEVELS[Math.min(idx + 1, TEXT_ZOOM_LEVELS.length - 1)];
  }
  return TEXT_ZOOM_LEVELS[Math.max(idx - 1, 0)];
}

export function applyTextZoom(level: TextZoomLevel) {
  document.documentElement.dataset.a11yTextZoom = String(level);
  document.documentElement.style.fontSize =
    level === DEFAULT_TEXT_ZOOM ? "" : `${level}%`;
}
