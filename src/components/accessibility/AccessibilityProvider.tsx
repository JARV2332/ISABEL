"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  COLOR_BLIND_CYCLE,
  t,
  type A11yLocale,
  type ColorBlindMode,
} from "@/lib/accessibility/i18n";
import {
  isA11ySpeaking,
  stopA11ySpeech,
} from "@/lib/accessibility/speech";

const STORAGE = {
  reader: "isabel-a11y-reader",
  locale: "isabel-a11y-locale",
  colorBlind: "isabel-a11y-cvd",
} as const;

interface AccessibilityContextValue {
  locale: A11yLocale;
  immersiveReader: boolean;
  colorBlindMode: ColorBlindMode;
  isSpeaking: boolean;
  labels: ReturnType<typeof t>;
  setLocale: (locale: A11yLocale) => void;
  toggleLocale: () => void;
  setImmersiveReader: (active: boolean) => void;
  toggleImmersiveReader: () => void;
  cycleColorBlindMode: () => void;
  setIsSpeaking: (speaking: boolean) => void;
  stopReading: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null
);

function readStoredLocale(): A11yLocale {
  if (typeof window === "undefined") return "es";
  return localStorage.getItem(STORAGE.locale) === "en" ? "en" : "es";
}

function readStoredColorBlind(): ColorBlindMode {
  if (typeof window === "undefined") return "none";
  const v = localStorage.getItem(STORAGE.colorBlind) as ColorBlindMode | null;
  return v && COLOR_BLIND_CYCLE.includes(v) ? v : "none";
}

function applyDocumentClasses(
  immersiveReader: boolean,
  colorBlindMode: ColorBlindMode,
  locale: A11yLocale
) {
  const root = document.documentElement;
  root.classList.toggle("immersive-reader", immersiveReader);
  root.lang = locale === "en" ? "en" : "es";

  for (const mode of COLOR_BLIND_CYCLE) {
    root.classList.toggle(`a11y-${mode}`, mode === colorBlindMode && mode !== "none");
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [locale, setLocaleState] = useState<A11yLocale>("es");
  const [immersiveReader, setImmersiveReaderState] = useState(false);
  const [colorBlindMode, setColorBlindModeState] =
    useState<ColorBlindMode>("none");
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setImmersiveReaderState(localStorage.getItem(STORAGE.reader) === "true");
    setColorBlindModeState(readStoredColorBlind());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyDocumentClasses(immersiveReader, colorBlindMode, locale);
    localStorage.setItem(STORAGE.reader, String(immersiveReader));
    localStorage.setItem(STORAGE.locale, locale);
    localStorage.setItem(STORAGE.colorBlind, colorBlindMode);
  }, [mounted, immersiveReader, colorBlindMode, locale]);

  useEffect(() => {
    if (!mounted) return;
    const id = window.setInterval(() => {
      setIsSpeaking(isA11ySpeaking());
    }, 300);
    return () => window.clearInterval(id);
  }, [mounted]);

  const setLocale = useCallback((next: A11yLocale) => {
    setLocaleState(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === "es" ? "en" : "es"));
  }, []);

  const setImmersiveReader = useCallback((active: boolean) => {
    setImmersiveReaderState(active);
    if (!active) stopA11ySpeech();
  }, []);

  const toggleImmersiveReader = useCallback(() => {
    setImmersiveReaderState((prev) => {
      if (prev) stopA11ySpeech();
      return !prev;
    });
  }, []);

  const cycleColorBlindMode = useCallback(() => {
    setColorBlindModeState((prev) => {
      const idx = COLOR_BLIND_CYCLE.indexOf(prev);
      return COLOR_BLIND_CYCLE[(idx + 1) % COLOR_BLIND_CYCLE.length];
    });
  }, []);

  const stopReading = useCallback(() => {
    stopA11ySpeech();
    setIsSpeaking(false);
  }, []);

  const labels = useMemo(() => t(locale), [locale]);

  const value = useMemo(
    () => ({
      locale,
      immersiveReader,
      colorBlindMode,
      isSpeaking,
      labels,
      setLocale,
      toggleLocale,
      setImmersiveReader,
      toggleImmersiveReader,
      cycleColorBlindMode,
      setIsSpeaking,
      stopReading,
    }),
    [
      locale,
      immersiveReader,
      colorBlindMode,
      isSpeaking,
      labels,
      setLocale,
      toggleLocale,
      setImmersiveReader,
      toggleImmersiveReader,
      cycleColorBlindMode,
      stopReading,
    ]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error("useAccessibility debe usarse dentro de AccessibilityProvider");
  }
  return ctx;
}

export function useAccessibilityOptional() {
  return useContext(AccessibilityContext);
}
