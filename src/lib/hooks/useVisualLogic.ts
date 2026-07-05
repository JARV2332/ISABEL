"use client";

import { useCallback, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useIsaAudio } from "@/lib/hooks/useIsaAudio";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import { extractTextFromPdf } from "@/lib/services/pdf-extract";
import { splitTextForTts } from "@/lib/services/read-aloud";
import type { ModuleStatus } from "@/types/module";

export function useVisualLogic() {
  const { toast } = useToast();
  const { submit } = useModuleN8n("visual");
  const { requestTts, isSpeaking, isLoadingTts, stop: stopSpeaking } =
    useIsaAudio();

  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isaResponse, setIsaResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [readProgress, setReadProgress] = useState<string | null>(null);

  const logActivity = useCallback(
    (text: string, event: string) => {
      void submit({
        event,
        data: { input: text, transcript: text },
      }).catch(() => {});

      void fetch("/api/interactions/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: "visual",
          eventType: event,
          inputText: text.slice(0, 500),
          outputText: text.slice(0, 500),
          metadata: { length: text.length, verbatim: true },
        }),
      }).catch(() => {});
    },
    [submit]
  );

  /** Lee el texto tal cual, sin resumir con IA. */
  const processText = useCallback(
    async (
      text: string,
      options?: {
        fromPdf?: boolean;
        spaceId?: string;
        sectionId?: string;
        silent?: boolean;
      }
    ) => {
      const trimmed = text.trim();
      if (!trimmed) {
        toast({
          title: "Texto requerido",
          description: "Escribe o pega el contenido que deseas escuchar.",
          variant: "destructive",
        });
        return;
      }

      setStatus("processing");
      setError(null);
      setReadProgress(null);

      try {
        const chunks = splitTextForTts(trimmed);
        setOutput(trimmed);
        setIsaResponse(
          options?.spaceId
            ? `Orientación en espacio: ${options.spaceId.replace(/-/g, " ")}.`
            : options?.fromPdf
              ? `Leyendo PDF completo (${trimmed.length.toLocaleString("es-GT")} caracteres).`
              : `Leyendo texto completo (${trimmed.length.toLocaleString("es-GT")} caracteres).`
        );
        setStatus("active");

        for (let i = 0; i < chunks.length; i++) {
          setReadProgress(
            chunks.length > 1
              ? `Parte ${i + 1} de ${chunks.length}…`
              : null
          );
          await requestTts(chunks[i]);
        }

        setReadProgress(null);
        const event = options?.spaceId
          ? "visual.space-guide"
          : options?.fromPdf
            ? "visual.pdf-read"
            : "visual.read-aloud";
        logActivity(trimmed, event);

        if (!options?.silent) {
          toast({
            title: options?.spaceId ? "Espacio descrito" : options?.fromPdf ? "PDF leído" : "Texto leído",
            description: options?.spaceId
              ? "ISA describió este espacio en voz alta."
              : "ISA leyó el contenido completo en voz alta.",
            variant: "success",
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al leer en voz alta";
        setError(message);
        setStatus("error");
        setReadProgress(null);
        toast({
          title: "Error en Visual",
          description: message,
          variant: "destructive",
        });
      }
    },
    [logActivity, requestTts, toast]
  );

  const processPdfFile = useCallback(
    async (file: File) => {
      setIsExtractingPdf(true);
      setError(null);
      setPdfFileName(file.name);

      try {
        const text = await extractTextFromPdf(file);
        setInput(text);
        await processText(text, { fromPdf: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudo leer el PDF";
        setError(message);
        setStatus("error");
        setPdfFileName(null);
        toast({
          title: "Error al leer PDF",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsExtractingPdf(false);
      }
    },
    [processText, toast]
  );

  const clearSession = useCallback(() => {
    stopSpeaking();
    setInput("");
    setOutput("");
    setIsaResponse(null);
    setError(null);
    setPdfFileName(null);
    setIsExtractingPdf(false);
    setReadProgress(null);
    setStatus("idle");
  }, [stopSpeaking]);

  return {
    status,
    input,
    setInput,
    output,
    isaResponse,
    error,
    isSpeaking,
    isLoadingTts,
    pdfFileName,
    isExtractingPdf,
    readProgress,
    isProcessing: status === "processing" || isExtractingPdf || isLoadingTts,
    processText,
    processPdfFile,
    stopSpeaking,
    clearSession,
  };
}
