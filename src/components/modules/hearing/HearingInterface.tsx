"use client";

import { Ear, Mic, MicOff, RotateCcw, Volume2 } from "lucide-react";
import { useCallback, useState } from "react";

import { ModuleShell } from "@/components/modules/ModuleShell";
import { SignCaptureCamera } from "@/components/modules/shared/SignCaptureCamera";
import { SignLanguageAvatar } from "@/components/modules/shared/SignLanguageAvatar";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { TabGroup } from "@/components/ui/tab-group";
import { useHearingLogic } from "@/lib/hooks/useHearingLogic";
import { useSignCapture } from "@/lib/hooks/useSignCapture";
import { hearingModule } from "@/lib/module-registry";
import type { ModuleViewProps } from "@/types/module";

type InputMode = "microphone" | "camera";

const INPUT_TABS = [
  { id: "microphone" as const, label: "Micrófono", icon: Mic },
  { id: "camera" as const, label: "Intérprete LSM", icon: Ear },
];

export function HearingInterface({ module = hearingModule }: ModuleViewProps) {
  const [inputMode, setInputMode] = useState<InputMode>("microphone");

  const mic = useHearingLogic();
  const camera = useSignCapture();

  const status =
    inputMode === "microphone" ? mic.status : camera.status;
  const error = inputMode === "microphone" ? mic.error : camera.error;
  const signSequence =
    inputMode === "microphone" ? mic.signSequence : camera.signSequence;
  const output = inputMode === "microphone" ? mic.output : camera.output;
  const isaResponse =
    inputMode === "microphone" ? mic.isaResponse : camera.isaResponse;

  const clearSession = useCallback(() => {
    mic.clearSession();
    camera.clearSignCapture();
  }, [mic, camera]);

  return (
    <ModuleShell
      module={module}
      status={status}
      isaResponse={isaResponse}
      error={error}
      actions={
        inputMode === "microphone" ? (
          <>
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={mic.isListening ? mic.stopListening : mic.startListening}
              aria-pressed={mic.isListening}
              aria-label={
                mic.isListening
                  ? "Detener captura de audio"
                  : "Iniciar captura de audio"
              }
            >
              {mic.isListening ? (
                <>
                  <MicOff aria-hidden="true" />
                  Detener micrófono
                </>
              ) : (
                <>
                  <Mic aria-hidden="true" />
                  Activar micrófono
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={clearSession}
              aria-label="Limpiar sesión"
            >
              <RotateCcw aria-hidden="true" />
              Limpiar
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={clearSession}
            aria-label="Limpiar sesión de intérprete"
          >
            <RotateCcw aria-hidden="true" />
            Limpiar
          </Button>
        )
      }
    >
      <TabGroup
        options={INPUT_TABS}
        value={inputMode}
        onChange={setInputMode}
        ariaLabel="Modo de entrada"
        className="mb-8"
      />

      {inputMode === "microphone" ? (
        <div
          id="panel-microphone"
          role="tabpanel"
          aria-labelledby="tab-microphone"
          className="space-y-6"
        >
          <section aria-labelledby="hearing-input-heading">
            <h2
              id="hearing-input-heading"
              className="mb-4 flex items-center gap-3 text-2xl font-extrabold text-[var(--module-fg)]"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/20 text-[var(--module-accent)]">
                <Ear className="size-6" aria-hidden="true" />
              </span>
              Micrófono → Señas LSM
            </h2>
            <p className="mb-5 text-lg leading-relaxed text-[var(--module-muted-fg)]">
              Habla una frase completa. Al detener el micrófono, ISA responde y
              el avatar interpreta en señas.
            </p>
            <Panel variant="inset" className="min-h-[8rem]">
              <div
                role="log"
                aria-live="polite"
                aria-label="Transcripción en tiempo real"
                className="text-xl leading-relaxed text-[var(--module-fg)]"
                tabIndex={0}
              >
                {mic.transcript || (
                  <span className="text-[var(--module-muted-fg)]">
                    {mic.isListening
                      ? "Escuchando…"
                      : "Toca «Activar micrófono» para comenzar."}
                  </span>
                )}
              </div>
            </Panel>
          </section>
        </div>
      ) : (
        <div
          id="panel-camera"
          role="tabpanel"
          aria-labelledby="tab-camera"
        >
          <SignCaptureCamera
            videoRef={camera.videoRef}
            canvasRef={camera.canvasRef}
            isCameraActive={camera.isCameraActive}
            isHandTracking={camera.isHandTracking}
            isModelLoading={camera.isModelLoading}
            handsDetected={camera.handsDetected}
            currentLetter={camera.currentLetter}
            currentConfidence={camera.currentConfidence}
            signBuffer={camera.signBuffer}
            signTranscript={camera.signTranscript}
            isProcessing={camera.status === "processing"}
            onStartCamera={() => void camera.startCamera()}
            onStopCamera={camera.stopCamera}
            onCaptureSign={() => void camera.captureSign()}
            onFinalizeBuffer={() => void camera.finalizeBuffer()}
          />
        </div>
      )}

      {output && (
        <>
          <SignLanguageAvatar sequence={signSequence} className="mt-8" />
          <section aria-labelledby="hearing-output-heading" className="mt-8">
            <h2
              id="hearing-output-heading"
              className="mb-4 text-2xl font-extrabold text-[var(--module-fg)]"
            >
              Respuesta de ISA
            </h2>
            {inputMode === "microphone" && mic.transcript && (
              <p className="mb-3 text-lg text-[var(--module-muted-fg)]">
                Tú dijiste: «{mic.transcript}»
              </p>
            )}
            {inputMode === "camera" && camera.signTranscript && (
              <p className="mb-3 text-lg text-[var(--module-muted-fg)]">
                Seña interpretada: «{camera.signTranscript}»
              </p>
            )}
            <Panel variant="accent" as="output">
              <p className="text-xl font-semibold leading-relaxed">{output}</p>
            </Panel>
            {(inputMode === "microphone"
              ? mic.isaVoiceText
              : camera.isaVoiceText) && (
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Button
                  type="button"
                  variant="accent"
                  disabled={
                    inputMode === "microphone"
                      ? mic.isLoadingTts
                      : camera.isLoadingTts
                  }
                  onClick={() =>
                    void (inputMode === "microphone"
                      ? mic.replayIsaVoice()
                      : camera.replayIsaVoice())
                  }
                  aria-label="Escuchar voz ISA con ElevenLabs"
                >
                  <Volume2 aria-hidden="true" />
                  {(
                    inputMode === "microphone"
                      ? mic.isLoadingTts
                      : camera.isLoadingTts
                  )
                    ? "Generando voz…"
                    : (
                          inputMode === "microphone"
                            ? mic.isSpeaking
                            : camera.isSpeaking
                        )
                      ? "Reproduciendo…"
                      : "Escuchar voz ISA"}
                </Button>
                {(inputMode === "microphone"
                  ? mic.lastAudioError
                  : camera.lastAudioError) && (
                  <p className="text-lg font-medium text-amber-700" role="status">
                    {inputMode === "microphone"
                      ? mic.lastAudioError
                      : camera.lastAudioError}
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </ModuleShell>
  );
}
