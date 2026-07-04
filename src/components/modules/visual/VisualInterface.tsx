"use client";

import { Eye, RotateCcw, Volume2, VolumeX } from "lucide-react";

import { ModuleShell } from "@/components/modules/ModuleShell";
import { Button } from "@/components/ui/button";
import { useVisualLogic } from "@/lib/hooks/useVisualLogic";
import { visualModule } from "@/lib/module-registry";
import type { ModuleViewProps } from "@/types/module";

export function VisualInterface({ module = visualModule }: ModuleViewProps) {
  const {
    status,
    input,
    setInput,
    output,
    isaResponse,
    error,
    isSpeaking,
    processText,
    stopSpeaking,
    clearSession,
  } = useVisualLogic();

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
            onClick={() => void processText(input)}
            aria-label="Procesar texto y leer en voz alta"
            className="min-h-11 bg-[var(--module-accent)] text-[var(--module-accent-fg)] hover:bg-[var(--module-accent)]/90"
          >
            <Volume2 aria-hidden="true" />
            Leer con ISA
          </Button>
          {isSpeaking && (
            <Button
              type="button"
              variant="outline"
              onClick={stopSpeaking}
              aria-label="Detener lectura en voz alta"
              className="min-h-11 border-[var(--module-border)] text-[var(--module-fg)]"
            >
              <VolumeX aria-hidden="true" />
              Detener voz
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={clearSession}
            aria-label="Limpiar texto y respuesta"
            className="min-h-11 border-[var(--module-border)] text-[var(--module-fg)]"
          >
            <RotateCcw aria-hidden="true" />
            Limpiar
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section aria-labelledby="visual-input-heading">
          <h2
            id="visual-input-heading"
            className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--module-fg)]"
          >
            <Eye className="size-5" aria-hidden="true" />
            Entrada: Texto
          </h2>
          <p className="mb-3 text-sm text-[var(--module-muted-fg)]">
            Escribe o pega el contenido. ISA lo procesará y lo leerá en voz
            alta.
          </p>
          <label htmlFor="visual-text-input" className="sr-only">
            Contenido a leer
          </label>
          <textarea
            id="visual-text-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={6}
            placeholder="Escribe o pega el texto aquí…"
            className="w-full resize-y rounded-lg border-2 border-[var(--module-border)] bg-[var(--module-bg)] p-4 text-lg leading-relaxed text-[var(--module-fg)] placeholder:text-[var(--module-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--module-accent)]"
          />
        </section>

        {output && (
          <section aria-labelledby="visual-output-heading">
            <h2
              id="visual-output-heading"
              className="mb-3 text-lg font-semibold text-[var(--module-fg)]"
            >
              Respuesta de ISA (Voz)
            </h2>
            <output className="block rounded-lg border-2 border-[var(--module-accent)] bg-[var(--module-bg)] p-4 text-lg font-medium text-[var(--module-fg)]">
              {output}
            </output>
            {isSpeaking && (
              <p
                role="status"
                className="mt-2 text-sm font-medium text-[var(--module-accent)]"
              >
                Leyendo en voz alta…
              </p>
            )}
          </section>
        )}
      </div>
    </ModuleShell>
  );
}
