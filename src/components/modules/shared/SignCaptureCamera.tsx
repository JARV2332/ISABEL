"use client";

import { Camera, CameraOff, Scan } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignCaptureCameraProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isCameraActive: boolean;
  isProcessing: boolean;
  signTranscript: string;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCaptureSign: () => void;
  className?: string;
}

export function SignCaptureCamera({
  videoRef,
  isCameraActive,
  isProcessing,
  signTranscript,
  onStartCamera,
  onStopCamera,
  onCaptureSign,
  className,
}: SignCaptureCameraProps) {
  return (
    <section
      aria-labelledby="sign-capture-heading"
      className={cn("space-y-4", className)}
    >
      <h2
        id="sign-capture-heading"
        className="flex items-center gap-2 text-lg font-semibold text-[var(--module-fg)]"
      >
        <Camera className="size-5" aria-hidden="true" />
        Entrada: Cámara (Señas → Texto)
      </h2>

      <p className="text-sm text-[var(--module-muted-fg)]">
        Activa la cámara, realiza una seña frente a ella y captura el gesto.
        ISA convertirá tus señas en texto (requiere n8n + Sign-Speak configurados).
      </p>

      <div className="relative overflow-hidden rounded-xl border-2 border-[var(--module-border)] bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={cn(
            "aspect-video w-full object-cover",
            !isCameraActive && "opacity-30"
          )}
          aria-label="Vista previa de la cámara para captura de señas"
        />
        {!isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-lg bg-black/70 px-4 py-2 text-sm text-white">
              Cámara apagada — presiona «Activar cámara»
            </p>
          </div>
        )}
        {isProcessing && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50"
            aria-busy="true"
            aria-label="Procesando seña"
          >
            <p className="rounded-lg bg-[var(--module-accent)] px-4 py-2 text-sm font-semibold text-[var(--module-accent-fg)]">
              Reconociendo seña…
            </p>
          </div>
        )}
      </div>

      <div
        className="flex flex-wrap gap-3"
        role="group"
        aria-label="Controles de cámara"
      >
        <Button
          type="button"
          onClick={isCameraActive ? onStopCamera : onStartCamera}
          aria-pressed={isCameraActive}
          aria-label={isCameraActive ? "Apagar cámara" : "Activar cámara"}
          className="min-h-11 bg-[var(--module-accent)] text-[var(--module-accent-fg)]"
        >
          {isCameraActive ? (
            <>
              <CameraOff aria-hidden="true" />
              Apagar cámara
            </>
          ) : (
            <>
              <Camera aria-hidden="true" />
              Activar cámara
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCaptureSign}
          disabled={!isCameraActive || isProcessing}
          aria-label="Capturar seña actual"
          className="min-h-11 border-[var(--module-border)] text-[var(--module-fg)]"
        >
          <Scan aria-hidden="true" />
          Capturar seña
        </Button>
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-label="Texto reconocido de las señas"
        className="min-h-[4rem] rounded-lg border-2 border-[var(--module-border)] bg-[var(--module-muted)] p-4 text-lg text-[var(--module-fg)]"
        tabIndex={0}
      >
        {signTranscript || (
          <span className="text-[var(--module-muted-fg)]">
            El texto de tus señas aparecerá aquí.
          </span>
        )}
      </div>
    </section>
  );
}
