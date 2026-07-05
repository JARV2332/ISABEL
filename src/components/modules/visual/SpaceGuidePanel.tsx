"use client";

import {
  BookOpen,
  Bus,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Landmark,
  MapPin,
  Pill,
  Stethoscope,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import {
  ACCESSIBILITY_SPACES,
  getSpaceById,
  getSpaceFullText,
  getSpaceSectionText,
} from "@/lib/data/accessibility-spaces";
import type { AccessibilitySpace } from "@/types/accessibility-space";
import { cn } from "@/lib/utils";

const SPACE_ICONS = {
  "salon-clases": GraduationCap,
  "clinica-pediatrica": Stethoscope,
  biblioteca: BookOpen,
  "terminal-buses": Bus,
  banco: Landmark,
  farmacia: Pill,
} as const;

interface SpaceGuidePanelProps {
  busy: boolean;
  isSpeaking: boolean;
  selectedSpaceId: string | null;
  onSelectSpace: (id: string | null) => void;
  onRead: (
    text: string,
    options: { spaceId: string; sectionId?: string; silent?: boolean }
  ) => Promise<void>;
}

export function SpaceGuidePanel({
  busy,
  isSpeaking,
  selectedSpaceId,
  onSelectSpace,
  onRead,
}: SpaceGuidePanelProps) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const space = selectedSpaceId ? getSpaceById(selectedSpaceId) : null;

  useEffect(() => {
    setSectionIndex(0);
  }, [selectedSpaceId]);

  const readSection = useCallback(
    async (targetSpace: AccessibilitySpace, index: number, silent = false) => {
      const section = targetSpace.sections[index];
      if (!section) return;
      await onRead(getSpaceSectionText(targetSpace, index), {
        spaceId: targetSpace.id,
        sectionId: section.id,
        silent,
      });
    },
    [onRead]
  );

  const handleSelectSpace = useCallback(
    async (id: string) => {
      onSelectSpace(id);
      const target = getSpaceById(id);
      if (!target) return;
      setSectionIndex(0);
      await readSection(target, 0);
    },
    [onSelectSpace, readSection]
  );

  const handleReadAll = useCallback(async () => {
    if (!space) return;
    await onRead(getSpaceFullText(space), {
      spaceId: space.id,
      sectionId: "completo",
    });
  }, [onRead, space]);

  const goPrev = useCallback(async () => {
    if (!space || sectionIndex <= 0) return;
    const next = sectionIndex - 1;
    setSectionIndex(next);
    await readSection(space, next);
  }, [readSection, sectionIndex, space]);

  const goNext = useCallback(async () => {
    if (!space || sectionIndex >= space.sections.length - 1) return;
    const next = sectionIndex + 1;
    setSectionIndex(next);
    await readSection(space, next);
  }, [readSection, sectionIndex, space]);

  const repeatSection = useCallback(async () => {
    if (!space) return;
    await readSection(space, sectionIndex, true);
  }, [readSection, sectionIndex, space]);

  if (!space) {
    return (
      <div className="space-y-4">
        <p className="text-base leading-relaxed text-[var(--module-muted-fg)] sm:text-lg">
          Elige un espacio simulado. ISA te orientará con mobiliario, accesibilidad
          y cómo pedir ayuda — como una estación en la pared o en tu móvil.
        </p>
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Espacios disponibles"
        >
          {ACCESSIBILITY_SPACES.map((item) => {
            const Icon =
              SPACE_ICONS[item.id as keyof typeof SPACE_ICONS] ?? MapPin;
            return (
              <button
                key={item.id}
                type="button"
                role="listitem"
                disabled={busy}
                onClick={() => void handleSelectSpace(item.id)}
                className={cn(
                  "human-press flex min-h-[7rem] flex-col items-start gap-2 rounded-2xl border-2 border-[var(--module-border)]",
                  "bg-[var(--module-bg)] p-4 text-left transition-colors",
                  "hover:border-[var(--module-accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                  "disabled:opacity-60"
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--module-accent)]/15 text-[var(--module-accent)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-base font-extrabold text-[var(--module-fg)] sm:text-lg">
                  {item.shortLabel}
                </span>
                <span className="text-sm text-[var(--module-muted-fg)]">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const currentSection = space.sections[sectionIndex];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--module-accent)]">
            Espacio activo
          </p>
          <h3 className="text-xl font-extrabold text-[var(--module-fg)] sm:text-2xl">
            {space.name}
          </h3>
          <p className="text-sm text-[var(--module-muted-fg)] sm:text-base">
            {space.subtitle}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => onSelectSpace(null)}
          disabled={busy}
        >
          Cambiar espacio
        </Button>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Secciones del espacio"
      >
        {space.sections.map((section, index) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={sectionIndex === index}
            disabled={busy}
            onClick={() => {
              setSectionIndex(index);
              void readSection(space, index);
            }}
            className={cn(
              "min-h-10 rounded-full border-2 px-4 text-xs font-bold sm:text-sm",
              sectionIndex === index
                ? "border-[var(--module-accent)] bg-[var(--module-accent)] text-[var(--module-accent-fg)]"
                : "border-[var(--module-border)] text-[var(--module-fg)] hover:border-[var(--module-accent)]"
            )}
          >
            {section.title}
          </button>
        ))}
      </div>

      <Panel variant="inset">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--module-accent)]">
          {currentSection?.title}
        </p>
        <p className="text-base leading-relaxed text-[var(--module-fg)] sm:text-lg">
          {currentSection?.content}
        </p>
      </Panel>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button
          type="button"
          variant="outline"
          disabled={busy || sectionIndex === 0}
          onClick={() => void goPrev()}
          className="min-h-11"
        >
          <ChevronLeft aria-hidden="true" />
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || isSpeaking}
          onClick={() => void repeatSection()}
          className="min-h-11"
        >
          <Volume2 aria-hidden="true" />
          Repetir
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || sectionIndex >= space.sections.length - 1}
          onClick={() => void goNext()}
          className="min-h-11"
        >
          Siguiente
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="accent"
          disabled={busy}
          onClick={() => void handleReadAll()}
          className="min-h-11 col-span-2 sm:col-span-1"
        >
          Escuchar todo
        </Button>
      </div>
    </div>
  );
}
