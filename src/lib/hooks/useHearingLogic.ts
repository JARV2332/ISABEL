"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import { signLanguageService } from "@/lib/services/sign-language";
import type { ModuleStatus } from "@/types/module";
import type { SignLanguageSequence } from "@/types/sign-language";

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ [index: number]: { transcript: string } }>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useHearingLogic() {
  const { toast } = useToast();
  const { submit } = useModuleN8n("hearing");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [output, setOutput] = useState("");
  const [signSequence, setSignSequence] = useState<SignLanguageSequence | null>(null);
  const [isaResponse, setIsaResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const transcriptRef = useRef("");

  const processTranscript = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setStatus("processing");
      setError(null);

      try {
        const spokenText = text.trim();

        await submit({
          event: "hearing.transcribe",
          data: { transcript: spokenText, input: spokenText },
        });

        // El avatar interpreta exactamente lo que se dijo en el audio
        const signs = signLanguageService.textToSequence(spokenText);

        setOutput(spokenText);
        setSignSequence(signs);
        setIsaResponse(
          `ISA interpreta en señas: ${spokenText}`
        );
        setStatus("active");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al procesar el audio";
        setError(message);
        setStatus("error");
        toast({
          title: "Error en Audición",
          description: message,
          variant: "destructive",
        });
      }
    },
    [submit, toast]
  );

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      const message = "Tu navegador no soporta reconocimiento de voz";
      setError(message);
      setStatus("error");
      toast({ title: "Micrófono no disponible", description: message, variant: "destructive" });
      return;
    }

    setError(null);
    setStatus("active");

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const parts: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        parts.push(event.results[i][0].transcript);
      }
      const text = parts.join(" ");
      transcriptRef.current = text;
      setTranscript(text);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setError(`Error de micrófono: ${event.error}`);
        setStatus("error");
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setIsaResponse("Escuchando audio del entorno…");
  }, [toast]);

  const stopListening = useCallback(async () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    await processTranscript(transcriptRef.current);
  }, [processTranscript]);

  const clearSession = useCallback(() => {
    transcriptRef.current = "";
    setTranscript("");
    setOutput("");
    setSignSequence(null);
    setIsaResponse(null);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    status,
    transcript,
    output,
    signSequence,
    isaResponse,
    error,
    isListening,
    startListening,
    stopListening,
    clearSession,
  };
}
