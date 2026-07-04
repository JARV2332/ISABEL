"use client";

import { AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PerformsAvatarProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  playerSrc: string;
  isReady: boolean;
  hasError: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onError: () => void;
  className?: string;
  title?: string;
}

export function PerformsAvatar({
  iframeRef,
  playerSrc,
  isReady,
  hasError,
  errorMessage,
  onRetry,
  onError,
  className,
  title = "Avatar 3D Performs — personaje interpretando señas",
}: PerformsAvatarProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 border-[var(--module-border)] bg-[#0b1f3a]",
        className
      )}
    >
      {!isReady && !hasError && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0b1f3a] p-4 text-sm text-[#e8edf4]"
          role="status"
          aria-live="polite"
        >
          <div
            className="size-8 animate-spin rounded-full border-2 border-[var(--module-accent)] border-t-transparent motion-reduce:animate-none"
            aria-hidden="true"
          />
          Cargando personaje 3D…
          <span className="text-xs text-[#9fb6d0]">
            Requiere conexión a internet
          </span>
        </div>
      )}

      {hasError && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0b1f3a] p-4 text-center text-sm text-[#e8edf4]"
          role="alert"
        >
          <AlertCircle className="size-6 text-[var(--module-accent)]" aria-hidden="true" />
          <p>{errorMessage ?? "No se pudo cargar el avatar 3D."}</p>
          {onRetry && (
            <Button
              type="button"
              size="sm"
              onClick={onRetry}
              className="bg-[var(--module-accent)] text-[var(--module-accent-fg)]"
            >
              <RefreshCw aria-hidden="true" />
              Reintentar
            </Button>
          )}
          <a
            href="https://performs.gti.upf.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--module-accent)] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--module-accent)]"
          >
            Abrir Performs
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      )}

      <iframe
        key={playerSrc}
        ref={iframeRef}
        src={playerSrc}
        title={title}
        className={cn(
          "aspect-video w-full min-h-[280px] border-0 sm:min-h-[360px]",
          !isReady && !hasError && "opacity-0"
        )}
        allow="autoplay"
        onError={onError}
        aria-label={title}
      />
    </div>
  );
}
