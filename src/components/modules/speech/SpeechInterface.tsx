"use client";

import { Mic, MicOff, Pencil, RotateCcw } from "lucide-react";
import { useCallback, useState } from "react";

import { ModuleShell } from "@/components/modules/ModuleShell";
import { SmartBoard } from "@/components/modules/speech/SmartBoard";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { TabGroup } from "@/components/ui/tab-group";
import { useSpeechLogic } from "@/lib/hooks/useSpeechLogic";
import { speechModule } from "@/lib/module-registry";
import type { ModuleViewProps } from "@/types/module";

type InputMode = "microphone" | "board";

const INPUT_TABS = [
  { id: "board" as const, label: "Pizarra", icon: Pencil },
  { id: "microphone" as const, label: "Micrófono", icon: Mic },
];

export function SpeechInterface({ module = speechModule }: ModuleViewProps) {
  const [inputMode, setInputMode] = useState<InputMode>("board");

  const speech = useSpeechLogic();

  const handleBoardText = useCallback(
    async (text: string) => {
      await speech.submitText(text);
    },
    [speech]
  );

  const clearAll = useCallback(() => {
    speech.clearSession();
  }, [speech]);

  return (
    <ModuleShell
      module={module}
      status={speech.status}
      isaResponse={speech.isaResponse}
      error={speech.error}
      actions={
        inputMode === "microphone" ? (
          <>
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={
                speech.isListening
                  ? speech.stopListening
                  : speech.startListening
              }
              aria-pressed={speech.isListening}
              aria-label={
                speech.isListening
                  ? "Detener grabación de voz"
                  : "Grabar con micrófono"
              }
            >
              {speech.isListening ? (
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
              className="flex-1 sm:flex-none"
              onClick={clearAll}
              aria-label="Limpiar sesión"
            >
              <RotateCcw aria-hidden="true" />
              Limpiar
            </Button>
          </>
        ) : null
      }
    >
      <TabGroup
        options={INPUT_TABS}
        value={inputMode}
        onChange={setInputMode}
        ariaLabel="Modo de entrada en Habla"
        className="mb-8"
      />

      {inputMode === "board" ? (
        <div id="panel-board" role="tabpanel" aria-labelledby="tab-board">
          <SmartBoard
            onTextRecognized={handleBoardText}
            isaOutput={speech.output || null}
            isProcessingIsa={speech.status === "processing"}
          />
        </div>
      ) : (
        <div
          id="panel-microphone"
          role="tabpanel"
          aria-labelledby="tab-microphone"
          className="space-y-6"
        >
          <section aria-labelledby="speech-mic-heading">
            <h2
              id="speech-mic-heading"
              className="mb-4 text-2xl font-extrabold text-[var(--module-fg)]"
            >
              Entrada por micrófono
            </h2>
            <p className="mb-5 text-lg text-[var(--module-muted-fg)]">
              Habla y ISA convertirá tu mensaje en respuesta clara con voz
              ElevenLabs.
            </p>
            <Panel variant="inset" className="min-h-[6rem]">
              <p className="text-xl text-[var(--module-fg)]">
                {speech.transcript || (
                  <span className="text-[var(--module-muted-fg)]">
                    {speech.isListening
                      ? "Escuchando…"
                      : "Toca «Grabar voz» para comenzar."}
                  </span>
                )}
              </p>
            </Panel>
          </section>

          {speech.output && (
            <section aria-labelledby="speech-mic-output">
              <h2
                id="speech-mic-output"
                className="mb-4 text-2xl font-extrabold text-[var(--module-fg)]"
              >
                Respuesta de ISA
              </h2>
              <Panel variant="accent" as="output">
                <p className="text-xl font-semibold">{speech.output}</p>
              </Panel>
            </section>
          )}
        </div>
      )}
    </ModuleShell>
  );
}
