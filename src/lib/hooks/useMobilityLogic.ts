"use client";

import { useCallback, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useIsaAudio } from "@/lib/hooks/useIsaAudio";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import { signLanguageService } from "@/lib/services/sign-language";
import type { ModuleStatus } from "@/types/module";
import type { SignLanguageSequence } from "@/types/sign-language";

export const PICTOGRAMS = [
  { id: "hola", label: "Hola", emoji: "👋" },
  { id: "ayuda", label: "Necesito ayuda", emoji: "🆘" },
  { id: "agua", label: "Quiero agua", emoji: "💧" },
  { id: "bano", label: "Baño", emoji: "🚻" },
  { id: "comida", label: "Tengo hambre", emoji: "🍽️" },
  { id: "dolor", label: "Me duele", emoji: "🤕" },
  { id: "si", label: "Sí", emoji: "✅" },
  { id: "no", label: "No", emoji: "❌" },
  { id: "gracias", label: "Gracias", emoji: "🙏" },
  { id: "jugar", label: "Quiero jugar", emoji: "⚽" },
  { id: "descanso", label: "Descanso", emoji: "😴" },
  { id: "feliz", label: "Estoy feliz", emoji: "😊" },
] as const;

export function useMobilityLogic() {
  const { toast } = useToast();
  const { submit } = useModuleN8n("mobility");
  const { speak, isSpeaking } = useIsaAudio();

  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [selectedPictograms, setSelectedPictograms] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [output, setOutput] = useState("");
  const [signSequence, setSignSequence] = useState<SignLanguageSequence | null>(null);
  const [isaResponse, setIsaResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePictogram = useCallback((id: string) => {
    setSelectedPictograms((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }, []);

  const buildMessage = useCallback(() => {
    const parts: string[] = selectedPictograms
      .map((id) => PICTOGRAMS.find((p) => p.id === id)?.label ?? "")
      .filter(Boolean);

    if (customText.trim()) parts.push(customText.trim());
    return parts.join(". ");
  }, [customText, selectedPictograms]);

  const sendMessage = useCallback(async () => {
    const message = buildMessage();
    if (!message) {
      toast({
        title: "Selecciona un pictograma",
        description: "Elige al menos un pictograma o escribe un mensaje.",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");
    setError(null);

    try {
      const response = await submit({
        event: "mobility.communicate",
        data: {
          input: message,
          pictograms: selectedPictograms,
          customText,
        },
      });

      const result = response.output ?? message;
      const signs = signLanguageService.parseFromN8n(
        response as Record<string, unknown>,
        message
      );

      setOutput(result);
      setSignSequence(signs);
      setIsaResponse(`ISA respondió en voz y lengua de señas: ${result}`);
      setStatus("active");

      void speak(result, { useElevenLabs: response.elevenLabsAvailable !== false });

      toast({
        title: "Mensaje enviado",
        description: "ISA procesó tu comunicación.",
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al enviar el mensaje";
      setError(message);
      setStatus("error");
      toast({
        title: "Error en Movilidad",
        description: message,
        variant: "destructive",
      });
    }
  }, [buildMessage, customText, selectedPictograms, speak, submit, toast]);

  const clearSession = useCallback(() => {
    setSelectedPictograms([]);
    setCustomText("");
    setOutput("");
    setSignSequence(null);
    setIsaResponse(null);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    status,
    selectedPictograms,
    customText,
    setCustomText,
    output,
    signSequence,
    isaResponse,
    error,
    isSpeaking,
    togglePictogram,
    sendMessage,
    clearSession,
    buildMessage,
  };
}
