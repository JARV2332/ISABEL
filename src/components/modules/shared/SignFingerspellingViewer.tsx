"use client";

import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import type { SignUnit } from "@/types/sign-language";

interface SignFingerspellingViewerProps {
  currentSign: SignUnit | null;
  currentIndex: number;
  totalSigns: number;
  isPlaying: boolean;
  size?: "default" | "hero";
  className?: string;
}

export function SignFingerspellingViewer({
  currentSign,
  currentIndex,
  totalSigns,
  isPlaying,
  size = "default",
  className,
}: SignFingerspellingViewerProps) {
  if (!currentSign?.imageUrl) return null;

  const isHero = size === "hero";
  const progress =
    totalSigns > 0 ? Math.round(((currentIndex + 1) / totalSigns) * 100) : 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isHero ? "rounded-[1.5rem]" : "rounded-xl",
        className
      )}
      role="img"
      aria-label={
        isPlaying
          ? `Letra ${currentSign.label}, ${currentIndex + 1} de ${totalSigns}`
          : `Letra ${currentSign.label}`
      }
    >
      <div
        className={cn(
          "relative flex flex-col items-center justify-center",
          isHero
            ? "min-h-[min(68vh,580px)] px-4 py-8 sm:px-8 sm:py-10"
            : "min-h-[280px] p-4 sm:min-h-[360px]"
        )}
      >
        <div
          className={cn(
            "relative flex w-full flex-1 flex-col items-center justify-center",
            isHero && "gap-5"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSign.imageUrl}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: isPlaying ? 1.02 : 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex w-full items-center justify-center"
            >
              <motion.img
                src={currentSign.imageUrl}
                alt={`Seña manual de la letra ${currentSign.label}`}
                width={isHero ? 480 : 200}
                height={isHero ? 560 : 240}
                animate={isPlaying ? { y: [0, -6, 0] } : { y: 0 }}
                transition={
                  isPlaying
                    ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
                className={cn(
                  "h-auto w-auto object-contain",
                  isHero
                    ? "max-h-[min(62vh,540px)] max-w-[min(92vw,520px)] drop-shadow-[0_20px_40px_rgba(15,23,42,0.25)]"
                    : "max-h-[280px] max-w-[220px] drop-shadow-lg"
                )}
              />
            </motion.div>
          </AnimatePresence>

          <p
            className={cn(
              "font-black tracking-[0.35em] text-[var(--module-accent)]",
              isHero ? "text-5xl sm:text-6xl" : "mt-2 text-3xl"
            )}
            aria-hidden="true"
          >
            {currentSign.label}
          </p>
        </div>
      </div>

      {totalSigns > 1 && (
        <div className={cn(isHero ? "px-2 pb-2 sm:px-4" : "px-2 pb-2")}>
          <div
            className={cn(
              "mb-2 flex justify-between font-semibold text-[var(--module-muted-fg)]",
              isHero ? "text-sm" : "text-xs"
            )}
            aria-hidden="true"
          >
            <span>
              Letra {currentIndex + 1} de {totalSigns}
            </span>
            <span>{progress}%</span>
          </div>
          <div
            className={cn(
              "overflow-hidden rounded-full bg-[var(--module-border)]",
              isHero ? "h-2.5" : "h-1.5"
            )}
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
