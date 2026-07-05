"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Accessibility,
  BookOpen,
  Globe,
  Palette,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { colorBlindLabel } from "@/lib/accessibility/i18n";
import {
  findReadableTarget,
  getElementSpeechText,
  readPageSequentially,
  speakA11y,
} from "@/lib/accessibility/speech";
import { cn } from "@/lib/utils";

export function ImmersiveReaderLayer() {
  const { immersiveReader, locale, setIsSpeaking, stopReading } =
    useAccessibility();
  const [highlighted, setHighlighted] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!immersiveReader) {
      setHighlighted(null);
      return;
    }

    const onClick = (event: MouseEvent) => {
      if ((event.target as Element).closest("[data-a11y-dock]")) return;

      const target = findReadableTarget(event.target);
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();

      setHighlighted(target);
      setIsSpeaking(true);
      void speakA11y(getElementSpeechText(target), locale).finally(() =>
        setIsSpeaking(false)
      );
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [immersiveReader, locale, setIsSpeaking]);

  useEffect(() => {
    if (!highlighted) return;
    highlighted.classList.add("immersive-reader-highlight");
    return () => highlighted.classList.remove("immersive-reader-highlight");
  }, [highlighted]);

  useEffect(() => {
    if (!immersiveReader) stopReading();
  }, [immersiveReader, stopReading]);

  if (!immersiveReader) return null;

  return (
    <div
      className="immersive-reader-scrim pointer-events-none fixed inset-0 z-[9980]"
      aria-hidden="true"
    />
  );
}

export function FloatingAccessibilityDock() {
  const {
    locale,
    immersiveReader,
    colorBlindMode,
    isSpeaking,
    labels,
    toggleImmersiveReader,
    toggleLocale,
    cycleColorBlindMode,
    stopReading,
    setIsSpeaking,
  } = useAccessibility();

  const [open, setOpen] = useState(false);
  const [readingPage, setReadingPage] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleReadPage = useCallback(async () => {
    setReadingPage(true);
    setIsSpeaking(true);
    try {
      await readPageSequentially(locale, (el) => {
        document
          .querySelectorAll(".immersive-reader-highlight")
          .forEach((node) => node.classList.remove("immersive-reader-highlight"));
        el?.classList.add("immersive-reader-highlight");
      });
    } finally {
      document
        .querySelectorAll(".immersive-reader-highlight")
        .forEach((node) => node.classList.remove("immersive-reader-highlight"));
      setReadingPage(false);
      setIsSpeaking(false);
    }
  }, [locale, setIsSpeaking]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      data-a11y-dock
      className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3"
    >
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={labels.dockTitle}
          className={cn(
            "w-[min(100vw-2rem,22rem)] rounded-[1.75rem] border-2 border-white/20",
            "bg-[#061424]/95 p-4 text-white shadow-2xl backdrop-blur-md"
          )}
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">{labels.dockTitle}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              aria-label={labels.closeMenu}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <DockButton
              active={immersiveReader}
              onClick={toggleImmersiveReader}
              icon={BookOpen}
              label={
                immersiveReader ? labels.readerOff : labels.readerOn
              }
            />

            <DockButton
              onClick={() => void handleReadPage()}
              disabled={readingPage}
              icon={Volume2}
              label={readingPage ? labels.reading : labels.readPage}
            />

            {(isSpeaking || readingPage) && (
              <DockButton
                onClick={stopReading}
                icon={VolumeX}
                label={labels.stopReading}
                variant="danger"
              />
            )}

            <DockButton
              onClick={toggleLocale}
              icon={Globe}
              label={`${labels.language}: ${locale === "es" ? labels.langEs : labels.langEn}`}
            />

            <DockButton
              onClick={cycleColorBlindMode}
              icon={Palette}
              label={`${labels.colorBlind}: ${colorBlindLabel(locale, colorBlindMode)}`}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "human-press flex size-16 items-center justify-center rounded-full",
          "border-4 border-white/30 bg-[image:var(--human-primary-gradient)]",
          "text-white shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
        )}
        aria-expanded={open}
        aria-label={open ? labels.closeMenu : labels.openMenu}
      >
        {open ? (
          <Square className="size-7" aria-hidden="true" />
        ) : (
          <Accessibility className="size-8" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

function DockButton({
  onClick,
  icon: Icon,
  label,
  active,
  disabled,
  variant = "default",
}: {
  onClick: () => void;
  icon: typeof BookOpen;
  label: string;
  active?: boolean;
  disabled?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-bold",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400",
        variant === "danger"
          ? "bg-red-600/90 hover:bg-red-600"
          : active
            ? "bg-yellow-400 text-black"
            : "bg-white/10 hover:bg-white/15"
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
