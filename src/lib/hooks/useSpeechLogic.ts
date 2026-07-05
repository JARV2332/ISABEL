"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useIsaAudio } from "@/lib/hooks/useIsaAudio";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import type { ModuleStatus } from "@/types/module";

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

export function useSpeechLogic() {
  const { toast } = useToast();
  const { submit } = useModuleN8n("speech");
  const { speak, isSpeaking, stop: stopSpeaking } = useIsaAudio();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");

  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [output, setOutput] = useState("");
  const [isaResponse, setIsaResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const processSpeech = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setStatus("processing");
      setError(null);

      try {
        const response = await submit({
          event: "speech.process",
          data: { transcript: text, input: text },
        });

        const result = response.output ?? "";
        setOutput(result);
        setIsaResponse(`ISA respondió: ${result}`);
        setStatus("active");

        void speak(result, { useElevenLabs: response.elevenLabsAvailable !== false });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al procesar el habla";
        setError(message);
        setStatus("error");
        toast({
          title: "Error en Habla",
          description: message,
          variant: "destructive",
        });
      }
    },
    [submit, toast, speak]
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
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
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

    recognition.onend = () => {
      setIsListening(false);
      const text = transcriptRef.current;
      if (text) {
        void processSpeech(text);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setIsaResponse("Escuchando tu voz…");
  }, [processSpeech, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const submitText = useCallback(
    async (text: string) => {
      transcriptRef.current = text;
      setTranscript(text);
      await processSpeech(text);
    },
    [processSpeech]
  );

  const clearSession = useCallback(() => {
    transcriptRef.current = "";
    setTranscript("");
    setOutput("");
    setIsaResponse(null);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    status,
    transcript,
    output,
    isaResponse,
    error,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    stopSpeaking,
    submitText,
    clearSession,
  };
}
