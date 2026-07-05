"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useIsaAudio } from "@/lib/hooks/useIsaAudio";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import { textToFingerspellingSequence } from "@/lib/services/fingerspelling";
import type { ModuleStatus } from "@/types/module";
import type { SignLanguageSequence } from "@/types/sign-language";

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

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function mergeTranscriptText(committed: string[], pending: string): string {
  const committedText = committed.join(" ").trim();
  const pendingText = pending.trim();
  if (committedText && pendingText) return `${committedText} ${pendingText}`;
  return committedText || pendingText;
}

export function useHearingLogic() {
  const { toast } = useToast();
  const { submit } = useModuleN8n("hearing");
  const { requestTts, isSpeaking, isLoadingTts, lastError, unlockAudio } =
    useIsaAudio();

  const [isaVoiceText, setIsaVoiceText] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wordsRef = useRef<string[]>([]);
  const sessionTranscriptRef = useRef("");
  const shouldCommitSessionRef = useRef(false);
  const isListeningRef = useRef(false);
  const isHoldingRef = useRef(false);

  const [words, setWords] = useState<string[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [output, setOutput] = useState("");
  const [signSequence, setSignSequence] = useState<SignLanguageSequence | null>(null);
  const [isaResponse, setIsaResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);

  const syncWords = useCallback((next: string[]) => {
    wordsRef.current = next;
    setWords(next);
  }, []);

  const transcript = words.join(" ");

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      isListeningRef.current = false;
      isHoldingRef.current = false;
    };
  }, []);

  const commitSession = useCallback(() => {
    const sessionText = sessionTranscriptRef.current.trim();
    if (sessionText) {
      const sessionWords = splitWords(sessionText);
      if (sessionWords.length > 0) {
        syncWords([...wordsRef.current, ...sessionWords]);
        setIsaResponse(
          "Texto agregado. Puedes seguir hablando, escribir más o tocar «Mostrar interpretación»."
        );
      }
    }

    sessionTranscriptRef.current = "";
    setLiveTranscript("");
    shouldCommitSessionRef.current = false;
  }, [syncWords]);

  const finalizeListening = useCallback(() => {
    isListeningRef.current = false;
    isHoldingRef.current = false;
    setIsListening(false);

    if (shouldCommitSessionRef.current) {
      commitSession();
    }
  }, [commitSession]);

  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      const message = "Permiso de micrófono denegado. Actívalo en el navegador.";
      setError(message);
      setStatus("error");
      toast({ title: "Micrófono bloqueado", description: message, variant: "destructive" });
      return false;
    }
  }, [toast]);

  const startListening = useCallback(async () => {
    if (isListeningRef.current || isHoldingRef.current) return;

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      const message = "Tu navegador no soporta reconocimiento de voz";
      setError(message);
      setStatus("error");
      toast({ title: "Micrófono no disponible", description: message, variant: "destructive" });
      return;
    }

    const hasMic = await requestMicrophoneAccess();
    if (!hasMic) return;

    isHoldingRef.current = true;
    setError(null);
    setStatus("active");
    unlockAudio();

    sessionTranscriptRef.current = "";
    setLiveTranscript("");
    shouldCommitSessionRef.current = false;

    recognitionRef.current?.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      if (!isHoldingRef.current) return;

      let sessionText = "";
      for (let i = 0; i < event.results.length; i++) {
        sessionText += event.results[i][0].transcript;
      }
      sessionText = sessionText.trim();
      sessionTranscriptRef.current = sessionText;
      setLiveTranscript(sessionText);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        finalizeListening();
        return;
      }

      setError(`Error de micrófono: ${event.error}`);
      setStatus("error");
      shouldCommitSessionRef.current = false;
      finalizeListening();
    };

    recognition.onend = () => {
      finalizeListening();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
      setIsaResponse("Escuchando… suelta el botón para agregar el texto.");
    } catch {
      isHoldingRef.current = false;
      isListeningRef.current = false;
      setIsListening(false);
      setError("No se pudo iniciar el micrófono");
      setStatus("error");
    }
  }, [toast, unlockAudio, requestMicrophoneAccess, finalizeListening]);

  const stopListening = useCallback(() => {
    if (!isHoldingRef.current && !isListeningRef.current) return;

    isHoldingRef.current = false;
    shouldCommitSessionRef.current = true;

    const recognition = recognitionRef.current;
    if (!recognition) {
      finalizeListening();
      return;
    }

    try {
      recognition.stop();
    } catch {
      finalizeListening();
    }

    window.setTimeout(() => {
      if (shouldCommitSessionRef.current) {
        finalizeListening();
      }
    }, 350);
  }, [finalizeListening]);

  const flushPendingTranscript = useCallback(() => {
    const pending = sessionTranscriptRef.current.trim();
    if (!pending) return;

    syncWords([...wordsRef.current, ...splitWords(pending)]);
    sessionTranscriptRef.current = "";
    setLiveTranscript("");
    shouldCommitSessionRef.current = false;
  }, [syncWords]);

  const appendManualText = useCallback(
    (text: string) => {
      const manualWords = splitWords(text);
      if (manualWords.length === 0) {
        toast({
          title: "Texto vacío",
          description: "Escribe algo antes de agregar.",
          variant: "destructive",
        });
        return;
      }

      syncWords([...wordsRef.current, ...manualWords]);
      setIsaResponse("Texto agregado. Toca «Mostrar interpretación» cuando quieras.");
    },
    [syncWords, toast]
  );

  const removeWordAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= wordsRef.current.length) return;
      syncWords(wordsRef.current.filter((_, i) => i !== index));
    },
    [syncWords]
  );

  const removeLastWord = useCallback(() => {
    if (wordsRef.current.length === 0) return;
    syncWords(wordsRef.current.slice(0, -1));
  }, [syncWords]);

  const removeLastLetter = useCallback(() => {
    const current = wordsRef.current;
    if (current.length === 0) return;

    const lastWord = current[current.length - 1];
    if (lastWord.length <= 1) {
      syncWords(current.slice(0, -1));
      return;
    }

    const next = [...current];
    next[next.length - 1] = lastWord.slice(0, -1);
    syncWords(next);
  }, [syncWords]);

  const interpretTranscript = useCallback(async () => {
    if (isHoldingRef.current || isListeningRef.current) {
      stopListening();
      await new Promise((resolve) => window.setTimeout(resolve, 400));
    }

    flushPendingTranscript();

    const text = mergeTranscriptText(wordsRef.current, sessionTranscriptRef.current);
    if (!text.trim()) {
      toast({
        title: "Sin texto",
        description: "Habla, escribe o agrega texto antes de interpretar.",
        variant: "destructive",
      });
      return;
    }

    if (!wordsRef.current.length) {
      syncWords(splitWords(text));
    }

    const finalText = mergeTranscriptText(wordsRef.current, "");
    setIsInterpreting(true);
    setStatus("processing");
    setError(null);

    try {
      const signs = textToFingerspellingSequence(finalText);
      setOutput(finalText);
      setSignSequence(signs);
      setIsaVoiceText(finalText);
      setIsaResponse(`Mostrando interpretación: «${finalText}»`);
      setStatus("active");

      void requestTts(finalText);

      void fetch("/api/interactions/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: "hearing",
          eventType: "hearing.transcribe",
          inputText: finalText,
          outputText: finalText,
        }),
      });

      void submit({
        event: "hearing.transcribe",
        data: { transcript: finalText, input: finalText },
      }).catch(() => {
        /* n8n opcional */
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al interpretar el texto";
      setError(message);
      setStatus("error");
      toast({
        title: "Error al interpretar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsInterpreting(false);
    }
  }, [stopListening, flushPendingTranscript, syncWords, submit, toast, requestTts]);
  const clearSession = useCallback(() => {
    recognitionRef.current?.abort();
    sessionTranscriptRef.current = "";
    shouldCommitSessionRef.current = false;
    isListeningRef.current = false;
    isHoldingRef.current = false;
    syncWords([]);
    setLiveTranscript("");
    setOutput("");
    setSignSequence(null);
    setIsaResponse(null);
    setIsaVoiceText(null);
    setError(null);
    setIsListening(false);
    setIsInterpreting(false);
    setStatus("idle");
  }, [syncWords]);

  const displayTranscript = mergeTranscriptText(words, liveTranscript);
  const hasInterpretText = Boolean(displayTranscript.trim());

  return {
    status,
    words,
    transcript,
    liveTranscript,
    displayTranscript,
    hasInterpretText,
    output,
    signSequence,
    isaResponse,
    error,
    isListening,
    isProcessing: isInterpreting,
    isSpeaking,
    isLoadingTts,
    lastAudioError: lastError,
    isaVoiceText,
    replayIsaVoice: () =>
      isaVoiceText ? requestTts(isaVoiceText) : Promise.resolve(false),
    startListening,
    stopListening,
    appendManualText,
    removeWordAt,
    removeLastWord,
    removeLastLetter,
    interpretTranscript,
    clearSession,
  };
}
