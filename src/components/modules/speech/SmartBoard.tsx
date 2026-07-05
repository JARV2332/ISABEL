"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Volume2 } from "lucide-react";
import { useCallback, useState } from "react";

import { HandwritingBoard } from "@/components/shared/HandwritingBoard";
import { getModuleTheme } from "@/lib/module-themes";
import { cn } from "@/lib/utils";

export interface SmartBoardProps {
  onTextRecognized: (text: string) => void | Promise<void>;
  isaOutput?: string | null;
  isRecognizing?: boolean;
  isProcessingIsa?: boolean;
  className?: string;
}

export function SmartBoard({
  onTextRecognized,
  isaOutput,
  isProcessingIsa = false,
  className,
}: SmartBoardProps) {
  const theme = getModuleTheme("speech");
  const [recognizedText, setRecognizedText] = useState<string | null>(null);

  const handleConfirm = useCallback(
    async (text: string) => {
      setRecognizedText(text);
      await onTextRecognized(text);
    },
    [onTextRecognized]
  );

  return (
    <section
      aria-labelledby="smart-board-heading"
      className={cn("space-y-6", className)}
    >
      <div>
        <h2
          id="smart-board-heading"
          className="mb-2 flex items-center gap-3 text-2xl font-extrabold text-[var(--module-fg)]"
        >
          <span
            className="flex size-12 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{ background: theme.gradient }}
          >
            <MessageCircle className="size-6" aria-hidden="true" />
          </span>
          Pizarra inteligente
        </h2>
      </div>

      <HandwritingBoard
        moduleId="speech"
        disabled={isProcessingIsa}
        confirmLabel="Hablar por mí"
        readLabel="Leer trazo"
        onConfirm={handleConfirm}
        autoClearOnConfirm={false}
      />

      <div className="space-y-4" aria-live="polite">
        <AnimatePresence mode="wait">
          {recognizedText && (
            <motion.div
              key={`user-${recognizedText}`}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex justify-end"
            >
              <div
                className="max-w-[90%] rounded-[1.75rem] rounded-br-md px-6 py-4 text-xl font-medium leading-relaxed text-white shadow-lg"
                style={{ background: theme.gradient }}
              >
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider opacity-80">
                  Tú escribiste
                </span>
                {recognizedText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isaOutput && (
            <motion.div
              key={`isa-${isaOutput}`}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="flex justify-start"
            >
              <div className="max-w-[90%] rounded-[1.75rem] rounded-bl-md border-2 border-pink-200/80 bg-white px-6 py-4 text-xl font-medium leading-relaxed text-slate-900 shadow-lg dark:border-pink-900/40 dark:bg-slate-900 dark:text-slate-100">
                <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-600">
                  <Volume2 className="size-3.5" aria-hidden="true" />
                  ISA responde
                </span>
                {isaOutput}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
