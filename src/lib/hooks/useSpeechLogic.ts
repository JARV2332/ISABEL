"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useIsaAudio } from "@/lib/hooks/useIsaAudio";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import type { ModuleStatus } from "@/types/module";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
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
  abort: () => void;
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
  const { speak, isSpeaking, isLoadingTts, lastError, unlockAudio, stop: stopSpeaking } =
    useIsaAudio();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const conversationListeningRef = useRef(false);

  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [messageDraft, setMessageDraft] = useState("");
  const [conversationTranscript, setConversationTranscript] = useState("");
  const [liveConversationText, setLiveConversationText] = useState("");
  const [output, setOutput] = useState("");
  const [isaResponse, setIsaResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingForMe, setIsSpeakingForMe] = useState(false);

  useEffect(() => {
    return () => {
      conversationListeningRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  const speakForMe = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        toast({
          title: "Sin mensaje",
          description: "Escribe o selecciona una frase antes de hablar.",
          variant: "destructive",
        });
        return;
      }

      setMessageDraft(trimmed);
      setOutput(trimmed);
      setError(null);
      setIsSpeakingForMe(true);
      setStatus("processing");
      setIsaResponse(`Isabel habla por ti: «${trimmed}»`);
      unlockAudio();

      try {
        await speak(trimmed, { useElevenLabs: true });
        setStatus("active");

        void submit({
          event: "speech.speak",
          data: { transcript: trimmed, input: trimmed },
        }).catch(() => {
          /* n8n opcional */
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudo reproducir la voz";
        setError(message);
        setStatus("error");
        toast({
          title: "Error al hablar",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsSpeakingForMe(false);
      }
    },
    [speak, submit, toast, unlockAudio]
  );

  const stopConversationListen = useCallback(() => {
    conversationListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setLiveConversationText("");
    setStatus("idle");
  }, []);

  const startConversationListen = useCallback(async () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      const message = "Tu navegador no soporta reconocimiento de voz";
      setError(message);
      setStatus("error");
      toast({ title: "Micrófono no disponible", description: message, variant: "destructive" });
      return;
    }

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        const message = "Permiso de micrófono denegado. Actívalo en el navegador.";
        setError(message);
        setStatus("error");
        toast({ title: "Micrófono bloqueado", description: message, variant: "destructive" });
        return;
      }
    }

    stopConversationListen();
    unlockAudio();
    setError(null);
    setStatus("active");
    setIsaResponse("Escuchando la respuesta de la otra persona…");

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      if (!conversationListeningRef.current) return;

      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      text = text.trim();
      setLiveConversationText(text);
      if (text) {
        setConversationTranscript(text);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        stopConversationListen();
        return;
      }
      setError(`Error de micrófono: ${event.error}`);
      setStatus("error");
      stopConversationListen();
    };

    recognition.onend = () => {
      if (conversationListeningRef.current) {
        try {
          recognition.start();
        } catch {
          stopConversationListen();
        }
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    conversationListeningRef.current = true;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      conversationListeningRef.current = false;
      setError("No se pudo iniciar el micrófono");
      setStatus("error");
    }
  }, [stopConversationListen, toast, unlockAudio]);

  const clearMessage = useCallback(() => {
    setMessageDraft("");
    setOutput("");
    setIsaResponse(null);
    setError(null);
    if (!isListening) setStatus("idle");
  }, [isListening]);

  const clearSession = useCallback(() => {
    stopConversationListen();
    stopSpeaking();
    setMessageDraft("");
    setConversationTranscript("");
    setLiveConversationText("");
    setOutput("");
    setIsaResponse(null);
    setError(null);
    setStatus("idle");
  }, [stopConversationListen, stopSpeaking]);

  const isBusy = isSpeakingForMe || isLoadingTts || status === "processing";

  return {
    status,
    messageDraft,
    setMessageDraft,
    conversationTranscript,
    liveConversationText,
    output,
    isaResponse,
    error,
    isListening,
    isSpeaking: isSpeaking || isSpeakingForMe,
    isBusy,
    lastAudioError: lastError,
    speakForMe,
    startConversationListen,
    stopConversationListen,
    clearMessage,
    clearSession,
  };
};
