"use client";

import { Mic, MicOff, RotateCcw, MessageSquare } from "lucide-react";
import { useState } from "react";

import { ModuleShell } from "@/components/modules/ModuleShell";
import { Button } from "@/components/ui/button";
import { useSpeechLogic } from "@/lib/hooks/useSpeechLogic";
import { speechModule } from "@/lib/module-registry";
import type { ModuleViewProps } from "@/types/module";

export function SpeechInterface({ module = speechModule }: ModuleViewProps) {
  const {
    status,
    transcript,
    output,
    isaResponse,
    error,
    isListening,
    startListening,
    stopListening,
    submitText,
    clearSession,
  } = useSpeechLogic();

  const [textInput, setTextInput] = useState("");

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
            onClick={isListening ? stopListening : startListening}
            aria-pressed={isListening}
            aria-label={
              isListening ? "Detener grabación de voz" : "Grabar con micrófono"
            }
            className="min-h-11 bg-[var(--module-accent)] text-[var(--module-accent-fg)] hover:bg-[var(--module-accent)]/90"
          >
            {isListening ? (
              <>
                <MicOff aria-hidden="true" />
                Detener
              </>
            ) : (
              <>
                <Mic aria-hidden="true" />
                Grabar voz
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearSession}
            aria-label="Limpiar sesión de habla"
            className="min-h-11 border-[var(--module-border)] text-[var(--module-fg)]"
          >
            <RotateCcw aria-hidden="true" />
            Limpiar
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section aria-labelledby="speech-input-heading">
          <h2
            id="speech-input-heading"
            className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--module-fg)]"
          >
            <Mic className="size-5" aria-hidden="true" />
            Entrada: Micrófono
          </h2>
          <p className="mb-3 text-sm text-[var(--module-muted-fg)]">
            Habla o escribe tu mensaje. ISA lo procesará y lo convertirá en
            texto/voz clara.
          </p>

          {transcript && (
            <blockquote className="mb-4 rounded-lg border-2 border-[var(--module-border)] bg-[var(--module-muted)] p-4 text-base text-[var(--module-fg)]">
              <span className="sr-only">Transcripción: </span>
              {transcript}
            </blockquote>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitText(textInput);
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="speech-text-input" className="sr-only">
              Escribir mensaje alternativo
            </label>
            <input
              id="speech-text-input"
              type="text"
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              placeholder="O escribe tu mensaje aquí…"
              className="min-h-11 flex-1 rounded-lg border-2 border-[var(--module-border)] bg-[var(--module-bg)] px-4 text-[var(--module-fg)] placeholder:text-[var(--module-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--module-accent)]"
            />
            <Button
              type="submit"
              variant="secondary"
              aria-label="Enviar texto escrito"
              className="min-h-11 bg-[var(--module-muted)] text-[var(--module-fg)]"
            >
              <MessageSquare aria-hidden="true" />
              Enviar texto
            </Button>
          </form>
        </section>

        {output && (
          <section aria-labelledby="speech-output-heading">
            <h2
              id="speech-output-heading"
              className="mb-3 text-lg font-semibold text-[var(--module-fg)]"
            >
              Respuesta de ISA (Voz/Texto)
            </h2>
            <output className="block rounded-lg border-2 border-[var(--module-accent)] bg-[var(--module-bg)] p-4 text-lg font-medium text-[var(--module-fg)]">
              {output}
            </output>
          </section>
        )}
      </div>
    </ModuleShell>
  );
}
