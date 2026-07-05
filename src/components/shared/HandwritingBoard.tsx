"use client";

import { Check, Eraser, PencilLine, RotateCcw, ScanLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
} from "react-sketch-canvas";

import { Button } from "@/components/ui/button";
import { useHandwritingRecognize } from "@/lib/hooks/useHandwritingRecognize";
import { getModuleTheme } from "@/lib/module-themes";
import type { ModuleId } from "@/types/module";
import { cn } from "@/lib/utils";

const STROKE_COLOR = "#000000";
const STROKE_WIDTH = 10;
const CANVAS_COLOR = "#FFFFFF";

export interface HandwritingBoardProps {
  moduleId?: ModuleId;
  onConfirm: (text: string) => void | Promise<void>;
  context?: string;
  disabled?: boolean;
  confirmLabel?: string;
  readLabel?: string;
  className?: string;
  autoClearOnConfirm?: boolean;
}

export function HandwritingBoard({
  moduleId = "visual",
  onConfirm,
  context = "",
  disabled = false,
  confirmLabel = "Confirmar y usar",
  readLabel = "Leer trazo",
  className,
  autoClearOnConfirm = true,
}: HandwritingBoardProps) {
  const theme = getModuleTheme(moduleId);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const hasStrokesRef = useRef(false);

  const { recognize, isRecognizing, error, clearError, setError } =
    useHandwritingRecognize(context);

  const [hasStrokes, setHasStrokes] = useState(false);
  const [draft, setDraft] = useState("");
  const [showReview, setShowReview] = useState(false);

  const handleClear = useCallback(async () => {
    await canvasRef.current?.clearCanvas();
    hasStrokesRef.current = false;
    setHasStrokes(false);
    setDraft("");
    setShowReview(false);
    clearError();
  }, [clearError]);

  const handleRead = useCallback(async () => {
    if (!canvasRef.current || !hasStrokesRef.current || disabled) {
      setError("Escribe algo en la pizarra antes de leer el trazo.");
      return;
    }

    clearError();
    const dataUrl = await canvasRef.current.exportImage("png");
    const text = await recognize(dataUrl);

    if (text) {
      setDraft(text);
      setShowReview(true);
    }
  }, [clearError, disabled, recognize, setError]);

  const handleConfirm = useCallback(async () => {
    const text = draft.trim();
    if (!text) {
      setError("Corrige o escribe el texto antes de confirmar.");
      return;
    }

    await onConfirm(text);
    if (autoClearOnConfirm) {
      await handleClear();
    }
  }, [autoClearOnConfirm, draft, handleClear, onConfirm, setError]);

  const handleRetry = useCallback(() => {
    setShowReview(false);
    setDraft("");
    clearError();
  }, [clearError]);

  useEffect(() => {
    return () => {
      void canvasRef.current?.clearCanvas();
    };
  }, []);

  const busy = disabled || isRecognizing;

  return (
    <div
      className={cn("space-y-5", className)}
      role="group"
      aria-label="Pizarra de escritura a mano"
    >
      <p className="text-lg leading-relaxed text-[var(--module-muted-fg)]">
        Escribe con el dedo o un lápiz sobre fondo blanco. Letras grandes y
        separadas funcionan mejor. Toca «{readLabel}», revisa el texto y
        confírmalo.
      </p>

      {context.trim() && (
        <p className="text-sm font-medium text-[var(--module-muted-fg)]" role="status">
          Texto previo: «{context.trim()}»
        </p>
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border-2 bg-white shadow-inner",
          disabled && "pointer-events-none opacity-60"
        )}
        style={{ borderColor: `${theme.accentLight}88` }}
      >
        <ReactSketchCanvas
          ref={canvasRef}
          onChange={() => {
            hasStrokesRef.current = true;
            setHasStrokes(true);
            clearError();
          }}
          strokeWidth={STROKE_WIDTH}
          strokeColor={STROKE_COLOR}
          canvasColor={CANVAS_COLOR}
          exportWithBackgroundImage
          style={{
            borderRadius: "2rem",
            width: "100%",
            minHeight: "320px",
            background: "#FFFFFF",
          }}
          svgStyle={{
            borderRadius: "2rem",
            touchAction: "none",
          }}
          className="min-h-[20rem] w-full sm:min-h-[24rem]"
          aria-label="Área de escritura a mano"
        />

        {isRecognizing && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[2rem] bg-white/80 backdrop-blur-sm"
            aria-busy="true"
            aria-label="Leyendo escritura"
          >
            <p
              className="rounded-full px-5 py-2 text-base font-bold text-white shadow-lg"
              style={{ background: theme.gradient }}
            >
              Leyendo trazo…
            </p>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-base font-semibold text-destructive">
          {error}
        </p>
      )}

      {showReview && (
        <div
          className="space-y-3 rounded-[1.5rem] border-2 p-4"
          style={{
            borderColor: `${theme.accentLight}99`,
            background: `${theme.accentLight}22`,
          }}
        >
          <label
            htmlFor="handwriting-review"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--module-fg)]"
          >
            <PencilLine className="size-4" aria-hidden="true" />
            Revisa y corrige si hace falta
          </label>
          <textarea
            id="handwriting-review"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className={cn(
              "w-full resize-y rounded-xl border-2 border-[var(--module-border)]",
              "bg-white p-4 text-xl leading-relaxed text-[var(--module-fg)]",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
            )}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="default"
              size="lg"
              className="flex-1"
              disabled={busy || !draft.trim()}
              onClick={() => void handleConfirm()}
            >
              <Check aria-hidden="true" />
              {confirmLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={busy}
              onClick={handleRetry}
            >
              <RotateCcw aria-hidden="true" />
              Volver a escribir
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 min-h-14"
          disabled={busy}
          onClick={() => void handleClear()}
          aria-label="Limpiar pizarra"
        >
          <Eraser aria-hidden="true" />
          Limpiar
        </Button>
        <Button
          type="button"
          variant="default"
          size="lg"
          className="flex-1 min-h-14 text-lg font-bold"
          disabled={busy || !hasStrokes}
          onClick={() => void handleRead()}
          aria-label={readLabel}
          style={{ background: theme.gradient }}
        >
          <ScanLine aria-hidden="true" />
          {isRecognizing ? "Leyendo…" : readLabel}
        </Button>
      </div>
    </div>
  );
}
