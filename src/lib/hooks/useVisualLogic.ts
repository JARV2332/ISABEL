"use client";

import { useCallback, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import type { ModuleStatus } from "@/types/module";

export function useVisualLogic() {
  const { toast } = useToast();
  const { submit } = useModuleN8n("visual");

  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isaResponse, setIsaResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const processText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast({
          title: "Texto requerido",
          description: "Escribe o pega el contenido que deseas escuchar.",
          variant: "destructive",
        });
        return;
      }

      setStatus("processing");
      setError(null);

      try {
        const response = await submit({
          event: "visual.describe",
          data: { input: text },
        });

        const result = response.output ?? text;
        setOutput(result);
        setIsaResponse(`ISA respondió: ${result}`);
        setStatus("active");
        speakText(result);

        toast({
          title: "Contenido listo",
          description: "ISA está leyendo el texto en voz alta.",
          variant: "success",
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al procesar el texto";
        setError(message);
        setStatus("error");
        toast({
          title: "Error en Visual",
          description: message,
          variant: "destructive",
        });
      }
    },
    [speakText, submit, toast]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const clearSession = useCallback(() => {
    stopSpeaking();
    setInput("");
    setOutput("");
    setIsaResponse(null);
    setError(null);
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
    processText,
    stopSpeaking,
    clearSession,
  };
}
