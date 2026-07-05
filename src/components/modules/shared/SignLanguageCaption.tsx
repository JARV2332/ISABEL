"use client";

import { cn } from "@/lib/utils";
import type { SignUnit } from "@/types/sign-language";

interface SignLanguageCaptionProps {
  sourceText: string;
  signs: SignUnit[];
  currentIndex: number;
  isPlaying: boolean;
  size?: "default" | "hero";
  className?: string;
}

export function SignLanguageCaption({
  sourceText,
  signs,
  currentIndex,
  isPlaying,
  size = "default",
  className,
}: SignLanguageCaptionProps) {
  const isHero = size === "hero";

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-[var(--module-accent)] bg-[var(--module-bg)]",
        isHero ? "p-5" : "p-4",
        className
      )}
      aria-live="polite"
      role="region"
      aria-label="Subtítulos de lo que se dijo y la seña actual"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--module-muted-fg)]">
        {isPlaying ? "🔊 Interpretando en señas…" : "Lo que se dijo"}
      </p>

      <p
        className={cn(
          "mb-3 font-medium leading-relaxed text-[var(--module-fg)]",
          isHero ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
        )}
      >
        «{sourceText}»
      </p>

      {signs.length > 0 && (
        <div
          className={cn("flex flex-wrap", isHero ? "gap-2.5" : "gap-2")}
          role="list"
          aria-label="Letras sincronizadas con la dactilología"
        >
          {signs.map((sign, index) => {
            const isActive = isPlaying && index === currentIndex;
            const isPast = index < currentIndex;

            return (
              <span
                key={`${sign.gloss}-${index}`}
                role="listitem"
                className={cn(
                  "rounded-md font-semibold transition-all motion-safe:duration-300",
                  isHero ? "px-3.5 py-2 text-base" : "px-3 py-1.5 text-sm",
                  isActive &&
                    "scale-105 bg-[var(--module-accent)] text-[var(--module-accent-fg)] shadow-md ring-2 ring-[var(--module-accent)]",
                  isPast &&
                    !isActive &&
                    "bg-[var(--module-muted)] text-[var(--module-muted-fg)] opacity-70",
                  !isActive &&
                    !isPast &&
                    "border border-[var(--module-border)] bg-[var(--module-muted)] text-[var(--module-fg)]"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {sign.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
