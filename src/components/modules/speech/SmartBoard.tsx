"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eraser, MessageCircle, Scan, Volume2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
} from "react-sketch-canvas";

import { VoiceWave } from "@/components/modules/speech/VoiceWave";
import { enhanceHandwritingImage } from "@/lib/handwriting-preprocess";
import { getModuleTheme } from "@/lib/module-themes";
import { cn } from "@/lib/utils";

const SCAN_INTERVAL_MS = 2500;
const STROKE_COLOR = "#000000";
const STROKE_WIDTH = 7;
const CANVAS_COLOR = "#f7f3eb";

type ScanTarget = "clear" | "speak" | "select";

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
  isRecognizing: externalRecognizing,
  isProcessingIsa = false,
  className,
}: SmartBoardProps) {
  const theme = getModuleTheme("speech");
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStrokesRef = useRef(false);

  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [internalRecognizing, setInternalRecognizing] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget>("speak");
  const [error, setError] = useState<string | null>(null);

  const isRecognizing = externalRecognizing ?? internalRecognizing;
  const isBusy = isRecognizing || isProcessingIsa;

  const exportAndRecognize = useCallback(async () => {
    if (!canvasRef.current || !hasStrokesRef.current) return;

    setInternalRecognizing(true);
    setError(null);

    try {
      const dataUrl = await canvasRef.current.exportImage("png");
      const enhanced = await enhanceHandwritingImage(dataUrl);

      const response = await fetch("/api/handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: enhanced, format: "png" }),
      });

      const data = (await response.json()) as {
        text?: string | null;
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo leer la pizarra");
      }

      if (!data.text?.trim()) {
        setError(
          data.message ??
            "Seguimos intentando leer tu trazo. Prueba «Hablar» o escribe más grande."
        );
        return;
      }

      setRecognizedText(data.text.trim());
      await onTextRecognized(data.text.trim());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al interpretar escritura"
      );
    } finally {
      setInternalRecognizing(false);
    }
  }, [onTextRecognized]);

  const handleCanvasChange = useCallback(() => {
    hasStrokesRef.current = true;
    setError(null);
  }, []);

  const handleClear = useCallback(async () => {
    await canvasRef.current?.clearCanvas();
    hasStrokesRef.current = false;
    setRecognizedText(null);
    setError(null);
  }, []);

  const handleSpeak = useCallback(() => {
    void exportAndRecognize();
  }, [exportAndRecognize]);

  const activateScanTarget = useCallback(() => {
    if (scanTarget === "clear") void handleClear();
    else if (scanTarget === "speak") handleSpeak();
    else if (scanTarget === "select") setScanMode(false);
  }, [scanTarget, handleClear, handleSpeak]);

  useEffect(() => {
    if (!scanMode) {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      return;
    }

    const targets: ScanTarget[] = ["clear", "speak", "select"];
    scanTimerRef.current = setInterval(() => {
      setScanTarget((prev) => {
        const idx = targets.indexOf(prev);
        return targets[(idx + 1) % targets.length];
      });
    }, SCAN_INTERVAL_MS);

    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, [scanMode]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") {
      if (scanMode) {
        event.preventDefault();
        activateScanTarget();
      }
    }
  };

  return (
    <section
      aria-labelledby="smart-board-heading"
      className={cn("space-y-6", className)}
      onKeyDown={handleKeyDown}
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
        <p className="text-lg leading-relaxed text-[var(--module-muted-fg)]">
          Escribe tu frase completa con el dedo o lápiz. Cuando termines, toca
          «Hablar» para que ISA la lea.
        </p>
      </div>

      {/* Área de escritura — textura crema, trazo alto contraste */}
      <div
        className="relative overflow-hidden rounded-[2rem] border-2 shadow-inner"
        style={{
          borderColor: `${theme.accentLight}66`,
          background: `
            radial-gradient(circle at 15% 20%, rgba(219,39,119,0.04) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(236,72,153,0.05) 0%, transparent 40%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 28px,
              rgba(12,18,34,0.025) 28px,
              rgba(12,18,34,0.025) 29px
            ),
            linear-gradient(165deg, #faf6ef 0%, #f0ebe3 50%, #f7f3eb 100%)
          `,
        }}
      >
        <ReactSketchCanvas
          ref={canvasRef}
          onChange={handleCanvasChange}
          strokeWidth={STROKE_WIDTH}
          strokeColor={STROKE_COLOR}
          canvasColor={CANVAS_COLOR}
          exportWithBackgroundImage
          style={{
            borderRadius: "2rem",
            width: "100%",
            minHeight: "320px",
          }}
          svgStyle={{
            borderRadius: "2rem",
            touchAction: "none",
          }}
          className="smart-board-canvas min-h-[20rem] w-full sm:min-h-[24rem]"
          aria-label="Área de escritura a mano. Dibuja tu mensaje aquí."
        />

        {isBusy && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[2rem] bg-gradient-to-t from-white/90 to-transparent px-6 pb-4 pt-10">
            <VoiceWave active />
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-lg font-semibold text-destructive">
          {error}
        </p>
      )}

      {/* Burbujas de chat */}
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

      {/* Controles gigantes + escaneo interruptor */}
      <div
        className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center"
        role="group"
        aria-label="Controles de pizarra"
      >
        <button
          type="button"
          onClick={() => void handleClear()}
          aria-label="Limpiar pizarra"
          className={cn(
            "human-press flex min-h-20 min-w-20 flex-col items-center justify-center gap-1 rounded-full border-2 bg-white px-6 py-4 text-base font-bold shadow-xl transition-all",
            scanMode &&
              scanTarget === "clear" &&
              "ring-4 ring-pink-500 ring-offset-4"
          )}
          style={{
            borderColor: theme.accentLight,
            color: theme.accent,
            boxShadow: theme.glow,
          }}
        >
          <Eraser className="size-8" aria-hidden="true" />
          Limpiar
        </button>

        <button
          type="button"
          onClick={handleSpeak}
          disabled={isBusy}
          aria-label="Hablar — enviar escritura a ISA"
          className={cn(
            "human-press flex size-28 flex-col items-center justify-center gap-1 rounded-full text-xl font-extrabold text-white shadow-2xl transition-all disabled:opacity-60",
            scanMode &&
              scanTarget === "speak" &&
              "ring-4 ring-white ring-offset-4 ring-offset-pink-200"
          )}
          style={{
            background: theme.gradient,
            boxShadow: `${theme.glow}, 0 16px 40px -8px rgb(219 39 119 / 0.5)`,
            minHeight: "5rem",
            minWidth: "5rem",
          }}
        >
          <Volume2 className="size-10" aria-hidden="true" />
          Hablar
        </button>

        <button
          type="button"
          onClick={() => setScanMode((v) => !v)}
          aria-pressed={scanMode}
          aria-label={
            scanMode
              ? "Desactivar modo escaneo interruptor"
              : "Activar modo escaneo interruptor"
          }
          className={cn(
            "human-press flex min-h-20 min-w-20 flex-col items-center justify-center gap-1 rounded-full border-2 border-slate-300 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-800 shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
            scanMode &&
              scanTarget === "select" &&
              "ring-4 ring-pink-500 ring-offset-4"
          )}
        >
          <Scan className="size-7" aria-hidden="true" />
          {scanMode ? "Escaneo ON" : "Interruptor"}
        </button>
      </div>

      {scanMode && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.5rem] border-2 border-pink-300/60 bg-pink-50 px-5 py-4 text-center dark:bg-pink-950/30"
          role="status"
        >
          <p className="text-lg font-bold text-pink-800 dark:text-pink-200">
            Modo interruptor — resaltado:{" "}
            {scanTarget === "clear"
              ? "Limpiar"
              : scanTarget === "speak"
                ? "Hablar"
                : "Interruptor"}
          </p>
          <p className="mt-1 text-base text-pink-700/80 dark:text-pink-300/80">
            Pulsa <kbd className="rounded bg-white px-2 py-0.5 font-mono">Espacio</kbd>{" "}
            o <kbd className="rounded bg-white px-2 py-0.5 font-mono">Enter</kbd> para
            seleccionar.
          </p>
          <button
            type="button"
            onClick={activateScanTarget}
            className="human-press mt-4 min-h-20 w-full max-w-md rounded-[1.5rem] text-lg font-extrabold text-white shadow-xl"
            style={{ background: theme.gradient }}
          >
            Seleccionar ahora
          </button>
        </motion.div>
      )}
    </section>
  );
}
