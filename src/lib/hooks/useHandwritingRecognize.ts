"use client";

import { useCallback, useState } from "react";

import { withBasePath } from "@/lib/base-path";
import {
  enhanceHandwritingImage,
  prepareHandwritingImage,
} from "@/lib/handwriting-preprocess";

interface HandwritingApiResponse {
  text?: string | null;
  error?: string;
  message?: string;
}

async function callHandwritingApi(
  imageBase64: string,
  context?: string
): Promise<{ text: string | null; error?: string }> {
  const response = await fetch(withBasePath("/api/handwriting"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: imageBase64,
      format: "png",
      context: context?.trim() || undefined,
    }),
  });

  const data = (await response.json()) as HandwritingApiResponse;

  if (!response.ok) {
    return { text: null, error: data.error ?? "No se pudo leer la escritura" };
  }

  return { text: data.text?.trim() ?? null };
}

export function useHandwritingRecognize(context?: string) {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognize = useCallback(
    async (dataUrl: string): Promise<string | null> => {
      setIsRecognizing(true);
      setError(null);

      try {
        const enhanced = await enhanceHandwritingImage(dataUrl);
        let result = await callHandwritingApi(enhanced, context);

        if (!result.text && !result.error) {
          const simple = await prepareHandwritingImage(dataUrl, "simple");
          result = await callHandwritingApi(simple, context);
        }

        if (result.error) {
          setError(result.error);
          return null;
        }

        if (!result.text) {
          setError(
            "No pude leer el trazo. Escribe letras más grandes, separadas, y toca de nuevo."
          );
          return null;
        }

        return result.text;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al interpretar escritura";
        setError(message);
        return null;
      } finally {
        setIsRecognizing(false);
      }
    },
    [context]
  );

  const clearError = useCallback(() => setError(null), []);

  return { recognize, isRecognizing, error, clearError, setError };
}
