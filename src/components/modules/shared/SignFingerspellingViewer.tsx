"use client";

import { cn } from "@/lib/utils";
import type { SignUnit } from "@/types/sign-language";

interface SignFingerspellingViewerProps {
  currentSign: SignUnit | null;
  currentIndex: number;
  totalSigns: number;
  isPlaying: boolean;
  className?: string;
}

export function SignFingerspellingViewer({
  currentSign,
  currentIndex,
  totalSigns,
  isPlaying,
  className,
}: SignFingerspellingViewerProps) {
  if (!currentSign?.imageUrl) return null;

  const progress =
    totalSigns > 0 ? Math.round(((currentIndex + 1) / totalSigns) * 100) : 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 border-[var(--module-border)] bg-[#0b1f3a]",
        className
      )}
      role="img"
      aria-label={
        isPlaying
          ? `Letra ${currentSign.label}, ${currentIndex + 1} de ${totalSigns}`
          : `Letra ${currentSign.label}`
      }
    >
      <div className="flex min-h-[280px] flex-col items-center justify-center bg-white p-4 sm:min-h-[360px]">
        <img
          key={currentSign.imageUrl}
          src={currentSign.imageUrl}
          alt={`Seña manual de la letra ${currentSign.label}`}
          width={200}
          height={240}
          className={cn(
            "h-auto w-auto max-h-[280px] max-w-[200px] object-contain motion-safe:transition-opacity motion-safe:duration-300",
            isPlaying && "motion-safe:scale-105"
          )}
        />

        <p
          className="mt-4 text-3xl font-bold tracking-widest text-[var(--module-accent)]"
          aria-hidden="true"
        >
          {currentSign.label}
        </p>
      </div>

      {totalSigns > 1 && (
        <div className="border-t border-[var(--module-border)] bg-[var(--module-muted)] px-4 py-2">
          <div
            className="mb-1 flex justify-between text-xs text-[var(--module-muted-fg)]"
            aria-hidden="true"
          >
            <span>
              Letra {currentIndex + 1} de {totalSigns}
            </span>
            <span>{progress}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-[var(--module-border)]"
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalSigns}
            aria-label="Progreso de la dactilología"
          >
            <div
              className="h-full rounded-full bg-[var(--module-accent)] motion-safe:transition-all motion-safe:duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
