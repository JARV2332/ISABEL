"use client";

import { Camera, CameraOff, Hand, Scan, Sparkles } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { letterImageUrl } from "@/lib/services/fingerspelling";
import { cn } from "@/lib/utils";

interface SignCaptureCameraProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  isHandTracking: boolean;
  isModelLoading: boolean;
  handsDetected: number;
  currentLetter: string | null;
  currentConfidence: number;
  signBuffer: string;
  signTranscript: string;
  isProcessing: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCaptureSign: () => void;
  onFinalizeBuffer: () => void;
  className?: string;
}

export function SignCaptureCamera({
  videoRef,
  canvasRef,
  isCameraActive,
  isHandTracking,
  isModelLoading,
  handsDetected,
  currentLetter,
  currentConfidence,
  signBuffer,
  signTranscript,
  isProcessing,
  onStartCamera,
  onStopCamera,
  onCaptureSign,
  onFinalizeBuffer,
  className,
}: SignCaptureCameraProps) {
  return (
    <section
      aria-labelledby="sign-capture-heading"
      className={cn("space-y-6", className)}
    >
      <div>
        <h2
          id="sign-capture-heading"
          className="mb-3 flex items-center gap-3 text-2xl font-extrabold text-[var(--module-fg)]"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/20 text-[var(--module-accent)]">
            <Hand className="size-6" aria-hidden="true" />
          </span>
          Señas a audio
        </h2>
        <p className="text-lg leading-relaxed text-[var(--module-muted-fg)]">
          Deletrea señas con la cámara. ISA convertirá tu mensaje en audio para
          que otras personas puedan escucharlo.
        </p>
        <details className="rounded-[1.5rem] border-2 border-border/60 bg-muted/40 px-5 py-3 text-base">
          <summary className="cursor-pointer font-bold text-[var(--module-fg)]">
            Guía rápida de letras
          </summary>
          <ul className="mt-3 space-y-1.5 text-[var(--module-muted-fg)]">
            <li><strong>A</strong> — Puño cerrado, pulgar al costado</li>
            <li><strong>B</strong> — 4 dedos rectos juntos, pulgar doblado</li>
            <li><strong>L</strong> — Pulgar e índice en forma de L</li>
            <li><strong>O</strong> — Pulgar e índice formando círculo</li>
            <li><strong>V</strong> — Índice y medio separados (V)</li>
            <li><strong>U</strong> — Índice y medio juntos</li>
            <li><strong>I</strong> — Solo meñique arriba</li>
            <li><strong>Y</strong> — Pulgar y meñique (🤙)</li>
            <li><strong>S</strong> — Puño con pulgar sobre los dedos</li>
          </ul>
        </details>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-[var(--module-border)] bg-black shadow-2xl">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={cn(
            "aspect-video w-full scale-x-[-1] object-cover",
            !isCameraActive && "opacity-20"
          )}
          aria-hidden="true"
        />
        <canvas
          ref={canvasRef}
          className={cn(
            "pointer-events-none absolute inset-0 aspect-video w-full scale-x-[-1] object-cover",
            !isCameraActive && "opacity-0"
          )}
          aria-hidden="true"
        />

        {!isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-isabel-deep-950/80">
            <p className="rounded-[1.5rem] bg-black/60 px-6 py-4 text-lg font-semibold text-white">
              Toca «Activar intérprete» para encender la cámara
            </p>
          </div>
        )}

        {isModelLoading && (
          <div className="absolute inset-x-0 top-4 flex justify-center">
            <span className="rounded-full bg-accent/90 px-4 py-2 text-sm font-bold text-isabel-deep-950">
              Cargando detector de manos…
            </span>
          </div>
        )}

        {isCameraActive && isHandTracking && (
          <div className="absolute inset-x-0 bottom-4 flex flex-wrap justify-center gap-2 px-4">
            <span
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold",
                handsDetected > 0
                  ? "bg-emerald-500/90 text-white"
                  : "bg-amber-500/90 text-isabel-deep-950"
              )}
            >
              {handsDetected > 0
                ? `${handsDetected} mano${handsDetected > 1 ? "s" : ""} detectada${handsDetected > 1 ? "s" : ""}`
                : "Busca tu mano en el cuadro"}
            </span>
            {currentLetter && (
              <span className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-isabel-deep-950">
                Letra: {currentLetter} ({currentConfidence}%)
              </span>
            )}
            {!currentLetter && currentConfidence > 0 && (
              <span className="rounded-full bg-amber-500/90 px-4 py-2 text-sm font-bold text-isabel-deep-950">
                Ajusta la pose ({currentConfidence}%)
              </span>
            )}
          </div>
        )}

        {isProcessing && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            aria-busy="true"
            aria-label="Interpretando seña"
          >
            <p className="rounded-[1.5rem] bg-accent px-6 py-4 text-lg font-bold text-isabel-deep-950">
              ISA interpretando…
            </p>
          </div>
        )}
        </div>

        <aside
          className="flex min-h-[320px] flex-col items-center justify-center px-2 py-4 lg:min-h-[420px]"
          aria-label="Referencia de la seña detectada"
        >
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--module-muted-fg)]">
            Seña de referencia
          </p>
          {currentLetter ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={letterImageUrl(currentLetter)}
                alt={`Referencia LSM de la letra ${currentLetter}`}
                className="max-h-[min(42vh,400px)] w-full max-w-[300px] object-contain drop-shadow-[0_16px_32px_rgba(15,23,42,0.22)]"
              />
              <p className="mt-5 text-4xl font-black tracking-[0.3em] text-[var(--module-accent)]">
                {currentLetter}
              </p>
              <p className="mt-3 text-sm font-medium text-[var(--module-muted-fg)]">
                Confianza: {currentConfidence}%
              </p>
            </>
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <Hand className="mb-4 size-14 text-[var(--module-accent)]/40" aria-hidden="true" />
              <p className="text-lg font-medium text-[var(--module-muted-fg)]">
                Aquí verás la seña de referencia cuando detectemos una letra.
              </p>
            </div>
          )}
        </aside>
      </div>

      <div
        className="flex flex-col gap-4 sm:flex-row sm:flex-wrap"
        role="group"
        aria-label="Controles del intérprete"
      >
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="flex-1"
          onClick={isCameraActive ? onStopCamera : onStartCamera}
          aria-pressed={isCameraActive}
          aria-label={isCameraActive ? "Apagar intérprete" : "Activar intérprete"}
        >
          {isCameraActive ? (
            <>
              <CameraOff aria-hidden="true" />
              Apagar intérprete
            </>
          ) : (
            <>
              <Camera aria-hidden="true" />
              Activar intérprete
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="default"
          size="lg"
          className="flex-1"
          onClick={onCaptureSign}
          disabled={!isCameraActive || isProcessing}
          aria-label="Interpretar seña con visión IA"
        >
          <Sparkles aria-hidden="true" />
          Interpretar ahora
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={onFinalizeBuffer}
          disabled={!signBuffer.trim() || isProcessing}
          aria-label="Confirmar texto deletreado"
        >
          <Scan aria-hidden="true" />
          Confirmar deletreo
        </Button>
      </div>

      <Panel variant="inset" className="min-h-[5rem]">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--module-accent)]">
          Señas detectadas
        </p>
        <div
          role="log"
          aria-live="polite"
          aria-label="Texto reconocido de las señas"
          className="text-2xl font-bold tracking-wide text-[var(--module-fg)]"
          tabIndex={0}
        >
          {signTranscript || signBuffer ? (
            signTranscript || signBuffer
          ) : (
            <span className="text-lg font-normal text-[var(--module-muted-fg)]">
              Deletrea letra por letra — aparecerá aquí en tiempo real.
            </span>
          )}
        </div>
      </Panel>
    </section>
  );
}
