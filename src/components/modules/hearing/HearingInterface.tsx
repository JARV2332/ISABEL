"use client";

import { Ear, Mic, MicOff, RotateCcw } from "lucide-react";
import { useCallback, useState } from "react";

import { ModuleShell } from "@/components/modules/ModuleShell";
import { SignCaptureCamera } from "@/components/modules/shared/SignCaptureCamera";
import { SignLanguageAvatar } from "@/components/modules/shared/SignLanguageAvatar";
import { Button } from "@/components/ui/button";
import { useHearingLogic } from "@/lib/hooks/useHearingLogic";
import { useSignCapture } from "@/lib/hooks/useSignCapture";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import { signLanguageService } from "@/lib/services/sign-language";
import { hearingModule } from "@/lib/module-registry";
import { cn } from "@/lib/utils";
import type { ModuleViewProps } from "@/types/module";
import type { SignLanguageSequence } from "@/types/sign-language";

type InputMode = "microphone" | "camera";

export function HearingInterface({ module = hearingModule }: ModuleViewProps) {
  const [inputMode, setInputMode] = useState<InputMode>("microphone");
  const { submit } = useModuleN8n("hearing");

  const mic = useHearingLogic();
  const camera = useSignCapture();

  const [cameraSignSequence, setCameraSignSequence] =
    useState<SignLanguageSequence | null>(null);
  const [cameraOutput, setCameraOutput] = useState("");

  const status =
    inputMode === "microphone" ? mic.status : camera.status;
  const error = inputMode === "microphone" ? mic.error : camera.error;
  const signSequence =
    inputMode === "microphone" ? mic.signSequence : cameraSignSequence;
  const output = inputMode === "microphone" ? mic.output : cameraOutput;

  const handleCaptureSign = useCallback(async () => {
    const text = await camera.captureSign();
    if (!text) return;

    setCameraOutput(text);

    try {
      const response = await submit({
        event: "hearing.sign-produce",
        data: { input: text, transcript: text },
      });

      const signs = signLanguageService.parseFromN8n(
        response as Record<string, unknown>,
        text
      );
      setCameraSignSequence(signs);
    } catch {
      setCameraSignSequence(signLanguageService.textToSequence(text));
    }
  }, [camera, submit]);

  const clearSession = useCallback(() => {
    mic.clearSession();
    camera.clearSignCapture();
    setCameraOutput("");
    setCameraSignSequence(null);
  }, [mic, camera]);

  const isaResponse =
    inputMode === "microphone"
      ? mic.isaResponse
      : camera.signTranscript
        ? `Seña reconocida: ${camera.signTranscript}`
        : null;

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
              onClick={mic.isListening ? mic.stopListening : mic.startListening}
              aria-pressed={mic.isListening}
              aria-label={
                mic.isListening
                  ? "Detener captura de audio"
                  : "Iniciar captura de audio"
              }
              className="min-h-11 bg-[var(--module-accent)] text-[var(--module-accent-fg)]"
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
              onClick={clearSession}
              aria-label="Limpiar sesión"
              className="min-h-11 border-[var(--module-border)]"
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
            aria-label="Limpiar sesión de cámara"
            className="min-h-11 border-[var(--module-border)]"
          >
            <RotateCcw aria-hidden="true" />
            Limpiar
          </Button>
        )
      }
    >
      {/* Selector de modo de entrada */}
      <div
        role="tablist"
        aria-label="Modo de entrada"
        className="mb-6 flex gap-2 rounded-lg border-2 border-[var(--module-border)] p-1"
      >
        {(
          [
            { id: "microphone" as const, label: "Micrófono", icon: Mic },
            { id: "camera" as const, label: "Cámara (señas)", icon: Ear },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={inputMode === id}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => setInputMode(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--module-accent)]",
              inputMode === id
                ? "bg-[var(--module-accent)] text-[var(--module-accent-fg)]"
                : "text-[var(--module-fg)] hover:bg-[var(--module-muted)]"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

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
              className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--module-fg)]"
            >
              <Ear className="size-5" aria-hidden="true" />
              Entrada: Micrófono → Avatar LSM
            </h2>
            <p className="mb-3 text-sm text-[var(--module-muted-fg)]">
              Habla una frase completa (ej: «Hola, ¿cómo estás?»). Al detener
              el micrófono, el avatar interpretará la misma frase en señas.
            </p>
            <div
              role="log"
              aria-live="polite"
              aria-label="Transcripción en tiempo real"
              className="min-h-[6rem] rounded-lg border-2 border-[var(--module-border)] bg-[var(--module-muted)] p-4 text-lg text-[var(--module-fg)]"
              tabIndex={0}
            >
              {mic.transcript || (
                <span className="text-[var(--module-muted-fg)]">
                  {mic.isListening
                    ? "Escuchando…"
                    : "Presiona «Activar micrófono» para comenzar."}
                </span>
              )}
            </div>
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
            isCameraActive={camera.isCameraActive}
            isProcessing={camera.status === "processing"}
            signTranscript={camera.signTranscript}
            onStartCamera={() => void camera.startCamera()}
            onStopCamera={camera.stopCamera}
            onCaptureSign={() => void handleCaptureSign()}
          />
        </div>
      )}

      {output && (
        <>
          <SignLanguageAvatar sequence={signSequence} className="mt-6" />
          <section aria-labelledby="hearing-output-heading" className="mt-6">
            <h2
              id="hearing-output-heading"
              className="mb-3 text-lg font-semibold text-[var(--module-fg)]"
            >
              Respuesta de ISA (Texto)
            </h2>
            <output className="block rounded-lg border-2 border-[var(--module-accent)] bg-[var(--module-bg)] p-4 text-lg font-medium text-[var(--module-fg)]">
              {output}
            </output>
          </section>
        </>
      )}
    </ModuleShell>
  );
}
