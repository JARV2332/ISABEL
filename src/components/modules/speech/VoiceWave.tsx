"use client";

import { motion } from "framer-motion";

interface VoiceWaveProps {
  active: boolean;
  className?: string;
}

/** Onda de voz estilo asistente — sin spinner */
export function VoiceWave({ active, className }: VoiceWaveProps) {
  if (!active) return null;

  const bars = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="ISA está procesando tu mensaje"
      className={className}
    >
      <div className="flex items-end justify-center gap-1.5 py-2">
        {bars.map((i) => (
          <motion.span
            key={i}
            className="w-2 rounded-full bg-gradient-to-t from-pink-600 to-rose-400"
            animate={{
              height: ["16px", "40px", "20px", "48px", "16px"],
            }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
            style={{ height: 16 }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-sm font-semibold text-pink-700 dark:text-pink-300">
        ISA está leyendo tu pizarra…
      </p>
    </div>
  );
}
