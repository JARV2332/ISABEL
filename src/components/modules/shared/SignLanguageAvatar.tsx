"use client";

import { Hand, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PerformsAvatar } from "@/components/modules/shared/PerformsAvatar";
import { SignFingerspellingViewer } from "@/components/modules/shared/SignFingerspellingViewer";
import { SignLanguageCaption } from "@/components/modules/shared/SignLanguageCaption";
import { Button } from "@/components/ui/button";
import { usePerformsAvatar } from "@/lib/hooks/usePerformsAvatar";
import { useSignLanguage } from "@/lib/hooks/useSignLanguage";
import {
  FINGERSPELLING_MS,
  toFingerspellingSequence,
} from "@/lib/services/fingerspelling";
import { cn } from "@/lib/utils";
import type { SignLanguageSequence } from "@/types/sign-language";

interface SignLanguageAvatarProps {
  sequence: SignLanguageSequence | null;
  className?: string;
  avatarName?: string;
  displaySize?: "default" | "hero";
}

export function SignLanguageAvatar({
  sequence,
  className,
  avatarName = "ISA",
  displaySize = "default",
}: SignLanguageAvatarProps) {
  const [show3dAvatar, setShow3dAvatar] = useState(false);
  const performs = usePerformsAvatar();
  const lastPlayedKey = useRef<string | null>(null);

  const displaySequence = useMemo(
    () => (sequence ? toFingerspellingSequence(sequence) : null),
    [sequence]
  );

  const {
    currentSign,
    currentIndex,
    totalSigns,
    isPlaying,
    hasVideo,
    loadSequence,
    play,
    pause,
    nextSign,
    prevSign,
  } = useSignLanguage({ signDurationMs: FINGERSPELLING_MS, autoPlay: true });

  useEffect(() => {
    loadSequence(displaySequence);
    lastPlayedKey.current = null;
  }, [displaySequence, loadSequence]);

  useEffect(() => {
    if (
      !show3dAvatar ||
      !performs.isReady ||
      !sequence ||
      hasVideo ||
      sequence.signs.length === 0
    ) {
      return;
    }

    const key = `${sequence.sourceText}::${sequence.signs.map((s) => s.gloss).join("|")}`;
    if (lastPlayedKey.current === key) return;

    performs.playSequence(sequence);
    lastPlayedKey.current = key;
  }, [
    show3dAvatar,
    performs.isReady,
    performs.playSequence,
    sequence,
    hasVideo,
  ]);

  if (!sequence || !displaySequence) return null;

  const progressLabel =
    totalSigns > 0
      ? `Letra ${currentIndex + 1} de ${totalSigns}: ${currentSign?.label ?? ""}`
      : "Reproduciendo video de lenguaje de señas";

  const isHero = displaySize === "hero";

  return (
    <section
      aria-labelledby="sign-avatar-heading"
      className={cn(
        "border-2 border-[var(--module-accent)] bg-[var(--module-muted)]",
        isHero ? "rounded-[2rem] p-5 sm:p-8" : "rounded-xl p-4 sm:p-6",
        className
      )}
    >
      <h2
        id="sign-avatar-heading"
        className={cn(
          "mb-2 flex items-center gap-2 font-semibold text-[var(--module-fg)]",
          isHero ? "text-2xl" : "text-lg"
        )}
      >
        <Hand className="size-5" aria-hidden="true" />
        LSM — {avatarName}
      </h2>

      <p
        className={cn(
          "mb-4 text-[var(--module-muted-fg)]",
          isHero ? "text-base leading-relaxed sm:text-lg" : "text-sm"
        )}
      >
        La frase se deletrea letra por letra con el abecedario manual (dactilología
        LSM) para que personas con discapacidad auditiva puedan leer las señas.
      </p>

      <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">
        {isPlaying ? `Interpretando: ${progressLabel}` : ""}
      </div>

      {hasVideo && sequence.avatarVideoUrl ? (
        <video
          controls
          autoPlay
          className="w-full rounded-lg border-2 border-[var(--module-border)] bg-black"
          aria-label={`Video de lenguaje de señas: ${sequence.sourceText}`}
        >
          <source src={sequence.avatarVideoUrl} type="video/mp4" />
        </video>
      ) : (
        <>
          <SignLanguageCaption
            sourceText={sequence.sourceText}
            signs={displaySequence.signs}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            size={displaySize}
            className="mb-4"
          />

          <SignFingerspellingViewer
            currentSign={currentSign}
            currentIndex={currentIndex}
            totalSigns={totalSigns}
            isPlaying={isPlaying}
            size={displaySize}
            className="mb-4"
          />

          {totalSigns > 1 && (
            <div
              className="mb-4 flex flex-wrap items-center justify-center gap-2"
              role="group"
              aria-label="Controles de reproducción"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={prevSign}
                disabled={currentIndex === 0}
                aria-label="Letra anterior"
                className="border-[var(--module-border)]"
              >
                <SkipBack aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (isPlaying) {
                    pause();
                  } else {
                    play();
                  }
                }}
                aria-label={isPlaying ? "Pausar" : "Repetir deletreo"}
                aria-pressed={isPlaying}
                className="bg-[var(--module-accent)] text-[var(--module-accent-fg)]"
              >
                {isPlaying ? (
                  <Pause aria-hidden="true" />
                ) : (
                  <Play aria-hidden="true" />
                )}
                {isPlaying ? "Pausar" : "Repetir"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={nextSign}
                disabled={currentIndex >= totalSigns - 1}
                aria-label="Siguiente letra"
                className="border-[var(--module-border)]"
              >
                <SkipForward aria-hidden="true" />
              </Button>
            </div>
          )}

          <details className="rounded-lg border border-[var(--module-border)] bg-[var(--module-bg)]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-[var(--module-muted-fg)]">
              Avatar 3D experimental (Performs)
            </summary>
            <div className="border-t border-[var(--module-border)] p-4">
              <p className="mb-3 text-xs text-[var(--module-muted-fg)]">
                Requiere conexión estable. Puede fallar en algunos navegadores.
              </p>
              {show3dAvatar && (
                <PerformsAvatar
                  iframeRef={performs.iframeRef}
                  playerSrc={performs.playerSrc}
                  isReady={performs.isReady}
                  hasError={performs.hasError}
                  errorMessage={performs.errorMessage}
                  onRetry={performs.retry}
                  onError={performs.handleIframeError}
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 border-[var(--module-border)]"
                onClick={() => setShow3dAvatar((value) => !value)}
              >
                {show3dAvatar ? "Ocultar avatar 3D" : "Activar avatar 3D"}
              </Button>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
