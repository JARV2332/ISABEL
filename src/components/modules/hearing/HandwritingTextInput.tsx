"use client";

import { Eraser, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
} from "react-sketch-canvas";

import { Button } from "@/components/ui/button";
import { enhanceHandwritingImage } from "@/lib/handwriting-preprocess";
import { cn } from "@/lib/utils";

const STROKE_COLOR = "#0c1222";
const STROKE_WIDTH = 7;
const CANVAS_COLOR = "#f7f3eb";

interface HandwritingTextInputProps {
  onTextRecognized: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function HandwritingTextInput({
  onTextRecognized,
  disabled = false,
  className,
}: HandwritingTextInputProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const hasStrokesRef = useRef(false);

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastPreview, setLastPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClear = useCallback(async () => {
    await canvasRef.current?.clearCanvas();
    hasStrokesRef.current = false;
    setError(null);
    setLastPreview(null);
  }, []);

  const handleAddText = useCallback(async () => {
    if (!canvasRef.current || !hasStrokesRef.current || disabled) return;

    setIsRecognizing(true);
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
        throw new Error(data.error ?? "No se pudo leer la escritura");
      }

      if (!data.text?.trim()) {
        setError(
          data.message ??
            "No pude leer el trazo. Escribe letras más grandes e intenta de nuevo."
        );
        return;
      }

      const text = data.text.trim();
      setLastPreview(text);
      onTextRecognized(text);
      await handleClear();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al interpretar escritura"
      );
    } finally {
      setIsRecognizing(false);
    }
  }, [disabled, handleClear, onTextRecognized]);

  useEffect(() => {
    return () => {
      void canvasRef.current?.clearCanvas();
    };
  }, []);

  return (
    <div
      className={cn("space-y-4", className)}
      role="group"
      aria-label="Escritura a mano"
    >
      <p className="text-base leading-relaxed text-[var(--module-muted-fg)]">
        Escribe con el dedo o un lápiz en la pizarra. Toca «Agregar texto» para
        sumarlo a tu mensaje.
      </p>

      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border-2 border-[var(--module-border)] shadow-inner",
          disabled && "pointer-events-none opacity-60"
        )}
        style={{
          background: `
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
          onChange={() => {
            hasStrokesRef.current = true;
          }}
          strokeWidth={STROKE_WIDTH}
          strokeColor={STROKE_COLOR}
          canvasColor={CANVAS_COLOR}
          exportWithBackgroundImage
          style={{
            borderRadius: "2rem",
            width: "100%",
            minHeight: "280px",
          }}
          svgStyle={{
            borderRadius: "2rem",
            touchAction: "none",
          }}
          className="min-h-[17.5rem] w-full sm:min-h-[20rem]"
          aria-label="Pizarra de escritura a mano"
        />

        {isRecognizing && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[2rem] bg-white/70 backdrop-blur-sm"
            aria-busy="true"
            aria-label="Leyendo escritura"
          >
            <p className="rounded-full bg-[var(--module-accent)] px-5 py-2 text-base font-bold text-isabel-deep-950">
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

      {lastPreview && (
        <p className="text-base text-[var(--module-muted-fg)]" role="status">
          Último texto agregado: «{lastPreview}»
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={disabled || isRecognizing}
          onClick={() => void handleClear()}
          aria-label="Limpiar pizarra"
        >
          <Eraser aria-hidden="true" />
          Limpiar pizarra
        </Button>
        <Button
          type="button"
          variant="default"
          size="lg"
          className="flex-1"
          disabled={disabled || isRecognizing}
          onClick={() => void handleAddText()}
          aria-label="Leer escritura y agregar al mensaje"
        >
          <Plus aria-hidden="true" />
          {isRecognizing ? "Leyendo…" : "Agregar texto"}
        </Button>
      </div>
    </div>
  );
}
