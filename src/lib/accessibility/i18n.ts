export type A11yLocale = "es" | "en";

export type ColorBlindMode =
  | "none"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia";

const strings = {
  es: {
    openMenu: "Abrir menú de accesibilidad",
    closeMenu: "Cerrar menú de accesibilidad",
    dockTitle: "Accesibilidad ISABEL",
    readerOn: "Activar lector inmersivo",
    readerOff: "Desactivar lector inmersivo",
    readerActive: "Lector inmersivo activo",
    readerHint:
      "Toca o haz clic en cualquier texto para escucharlo. Usa «Leer página» para recorrer todo el contenido.",
    readPage: "Leer página completa",
    stopReading: "Detener lectura",
    language: "Idioma",
    langEs: "Español",
    langEn: "English",
    colorBlind: "Modo daltónico",
    colorBlindNone: "Colores normales",
    colorBlindProtanopia: "Protanopia (rojo-verde)",
    colorBlindDeuteranopia: "Deuteranopia (rojo-verde)",
    colorBlindTritanopia: "Tritanopia (azul-amarillo)",
    textZoom: "Tamaño de texto",
    textZoomIn: "Aumentar texto",
    textZoomOut: "Reducir texto",
    textZoomReset: "Restablecer tamaño de texto",
    textZoomLevel: "Texto al {level}%",
    reading: "Leyendo…",
    readDone: "Lectura terminada",
  },
  en: {
    openMenu: "Open accessibility menu",
    closeMenu: "Close accessibility menu",
    dockTitle: "ISABEL Accessibility",
    readerOn: "Enable immersive reader",
    readerOff: "Disable immersive reader",
    readerActive: "Immersive reader active",
    readerHint:
      "Tap or click any text to hear it. Use «Read full page» to go through all content.",
    readPage: "Read full page",
    stopReading: "Stop reading",
    language: "Language",
    langEs: "Español",
    langEn: "English",
    colorBlind: "Color blind mode",
    colorBlindNone: "Normal colors",
    colorBlindProtanopia: "Protanopia (red-green)",
    colorBlindDeuteranopia: "Deuteranopia (red-green)",
    colorBlindTritanopia: "Tritanopia (blue-yellow)",
    textZoom: "Text size",
    textZoomIn: "Increase text size",
    textZoomOut: "Decrease text size",
    textZoomReset: "Reset text size",
    textZoomLevel: "Text at {level}%",
    reading: "Reading…",
    readDone: "Reading complete",
  },
} as const;

export function t(locale: A11yLocale) {
  return strings[locale];
}

export function colorBlindLabel(
  locale: A11yLocale,
  mode: ColorBlindMode
): string {
  const labels = t(locale);
  switch (mode) {
    case "protanopia":
      return labels.colorBlindProtanopia;
    case "deuteranopia":
      return labels.colorBlindDeuteranopia;
    case "tritanopia":
      return labels.colorBlindTritanopia;
    default:
      return labels.colorBlindNone;
  }
}

export const COLOR_BLIND_CYCLE: ColorBlindMode[] = [
  "none",
  "protanopia",
  "deuteranopia",
  "tritanopia",
];
