"use client";

import { useCallback, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useIsaAudio } from "@/lib/hooks/useIsaAudio";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import type { ModuleStatus } from "@/types/module";

export function useVisualLogic() {
  const { toast } = useToast();
  const { submit } = useModuleN8n("visual");
  const { speak, isSpeaking, stop: stopSpeaking } = useIsaAudio();

  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isaResponse, setIsaResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        void speak(result, response.audioUrl);

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
    [speak, submit, toast]
  );

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
