"use client";

import { Accessibility, RotateCcw, Send } from "lucide-react";

import { ModuleShell } from "@/components/modules/ModuleShell";
import { SignLanguageAvatar } from "@/components/modules/shared/SignLanguageAvatar";
import { Button } from "@/components/ui/button";
import {
  PICTOGRAMS,
  useMobilityLogic,
} from "@/lib/hooks/useMobilityLogic";
import { mobilityModule } from "@/lib/module-registry";
import { cn } from "@/lib/utils";
import type { ModuleViewProps } from "@/types/module";

export function MobilityInterface({ module = mobilityModule }: ModuleViewProps) {
  const {
    status,
    selectedPictograms,
    customText,
    setCustomText,
    output,
    signSequence,
    isaResponse,
    error,
    togglePictogram,
    sendMessage,
    clearSession,
    buildMessage,
  } = useMobilityLogic();

  const preview = buildMessage();

  return (
    <ModuleShell
      module={module}
      status={status}
      isaResponse={isaResponse}
      error={error}
      actions={
        <>
          <Button
            type="button"
            onClick={() => void sendMessage()}
            aria-label="Enviar mensaje compuesto con pictogramas"
            className="min-h-11 bg-[var(--module-accent)] text-[var(--module-accent-fg)] hover:bg-[var(--module-accent)]/90"
          >
            <Send aria-hidden="true" />
            Enviar mensaje
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearSession}
            aria-label="Limpiar selección y respuesta"
            className="min-h-11 border-[var(--module-border)] text-[var(--module-fg)]"
          >
            <RotateCcw aria-hidden="true" />
            Limpiar
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section aria-labelledby="mobility-input-heading">
          <h2
            id="mobility-input-heading"
            className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--module-fg)]"
          >
            <Accessibility className="size-5" aria-hidden="true" />
            Entrada: Pictogramas y Texto
          </h2>
          <p className="mb-4 text-sm text-[var(--module-muted-fg)]">
            Selecciona pictogramas o escribe un mensaje. ISA lo convertirá en
            voz, texto y lenguaje de señas (LSM).
          </p>

          <div
            role="group"
            aria-label="Pictogramas de comunicación"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          >
            {PICTOGRAMS.map((pictogram) => {
              const isSelected = selectedPictograms.includes(pictogram.id);

              return (
                <button
                  key={pictogram.id}
                  type="button"
                  onClick={() => togglePictogram(pictogram.id)}
                  aria-pressed={isSelected}
                  aria-label={pictogram.label}
                  className={cn(
                    "flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-lg border-2 p-3 text-center transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--module-accent)] focus-visible:ring-offset-2",
                    isSelected
                      ? "border-[var(--module-accent)] bg-[var(--module-accent)] text-[var(--module-accent-fg)]"
                      : "border-[var(--module-border)] bg-[var(--module-muted)] text-[var(--module-fg)] hover:border-[var(--module-accent)]"
                  )}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {pictogram.emoji}
                  </span>
                  <span className="text-sm font-semibold leading-tight">
                    {pictogram.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label
              htmlFor="mobility-text-input"
              className="mb-2 block text-sm font-medium text-[var(--module-fg)]"
            >
              Texto adicional (opcional)
            </label>
            <input
              id="mobility-text-input"
              type="text"
              value={customText}
              onChange={(event) => setCustomText(event.target.value)}
              placeholder="Añade un mensaje personalizado…"
              className="min-h-11 w-full rounded-lg border-2 border-[var(--module-border)] bg-[var(--module-bg)] px-4 text-[var(--module-fg)] placeholder:text-[var(--module-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--module-accent)]"
            />
          </div>

          {preview && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 rounded-lg border-2 border-dashed border-[var(--module-border)] bg-[var(--module-muted)] p-4 text-base text-[var(--module-fg)]"
            >
              <span className="font-semibold">Vista previa: </span>
              {preview}
            </div>
          )}
        </section>

        {output && (
          <>
            <SignLanguageAvatar sequence={signSequence} className="mt-2" />

            <section aria-labelledby="mobility-output-heading">
              <h2
                id="mobility-output-heading"
                className="mb-3 text-lg font-semibold text-[var(--module-fg)]"
              >
                Respuesta de ISA (Voz/Texto)
              </h2>
              <output className="block rounded-lg border-2 border-[var(--module-accent)] bg-[var(--module-bg)] p-4 text-lg font-medium text-[var(--module-fg)]">
                {output}
              </output>
            </section>
          </>
        )}
      </div>
    </ModuleShell>
  );
}
