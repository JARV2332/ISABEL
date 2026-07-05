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

  const [words, setWords] = useState<string[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [output, setOutput] = useState("");
  const [signSequence, setSignSequence] = useState<SignLanguageSequence | null>(null);
  const [isaResponse, setIsaResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const syncWords = useCallback((next: string[]) => {
    wordsRef.current = next;
    setWords(next);
  }, []);

  const transcript = words.join(" ");

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const commitSession = useCallback(() => {
    const sessionText = sessionTranscriptRef.current.trim();
    if (sessionText) {
      const sessionWords = splitWords(sessionText);
      if (sessionWords.length > 0) {
        syncWords([...wordsRef.current, ...sessionWords]);
        setIsaResponse(
          "Texto agregado. Puedes seguir hablando, escribir más o tocar «Interpretar»."
        );
      }
    }

    sessionTranscriptRef.current = "";
    setLiveTranscript("");
    shouldCommitSessionRef.current = false;
  }, [syncWords]);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      const message = "Tu navegador no soporta reconocimiento de voz";
      setError(message);
      setStatus("error");
      toast({ title: "Micrófono no disponible", description: message, variant: "destructive" });
      return;
    }

    if (isListening) return;

    setError(null);
    setStatus("active");
    unlockAudio();

    sessionTranscriptRef.current = "";
    setLiveTranscript("");
    shouldCommitSessionRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let sessionText = "";
      for (let i = 0; i < event.results.length; i++) {
        sessionText += event.results[i][0].transcript;
      }
      sessionText = sessionText.trim();
      sessionTranscriptRef.current = sessionText;
      setLiveTranscript(sessionText);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setError(`Error de micrófono: ${event.error}`);
        setStatus("error");
      }
      setIsListening(false);
      shouldCommitSessionRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      if (shouldCommitSessionRef.current) {
        commitSession();
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      setIsaResponse("Escuchando… suelta el botón para agregar el texto.");
    } catch {
      setError("No se pudo iniciar el micrófono");
      setStatus("error");
    }
  }, [toast, unlockAudio, isListening, commitSession]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    shouldCommitSessionRef.current = true;
    recognitionRef.current.stop();
  }, [isListening]);

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
      setIsaResponse("Texto escrito agregado. Toca «Interpretar» cuando quieras.");
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
    if (isListening) {
      shouldCommitSessionRef.current = true;
      recognitionRef.current?.stop();
    }

    const pending = sessionTranscriptRef.current.trim();
    if (pending) {
      syncWords([...wordsRef.current, ...splitWords(pending)]);
      sessionTranscriptRef.current = "";
      setLiveTranscript("");
    }

    const text = wordsRef.current.join(" ").trim();
    if (!text) {
      toast({
        title: "Sin texto",
        description: "Habla, escribe o agrega texto antes de interpretar.",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");
    setError(null);

    try {
      const signs = textToFingerspellingSequence(text);
      setOutput(text);
      setSignSequence(signs);
      setIsaVoiceText(text);
      setIsaResponse(`Interpretando en señas: «${text}»`);
      setStatus("active");

      void requestTts(text);

      void fetch("/api/interactions/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: "hearing",
          eventType: "hearing.transcribe",
          inputText: text,
          outputText: text,
        }),
      });

      try {
        await submit({
          event: "hearing.transcribe",
          data: { transcript: text, input: text },
        });
      } catch {
        /* Las señas locales ya están listas; n8n es opcional aquí */
      }
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
    }
  }, [isListening, syncWords, submit, toast, requestTts]);

  const clearSession = useCallback(() => {
    recognitionRef.current?.abort();
    sessionTranscriptRef.current = "";
    shouldCommitSessionRef.current = false;
    syncWords([]);
    setLiveTranscript("");
    setOutput("");
    setSignSequence(null);
    setIsaResponse(null);
    setIsaVoiceText(null);
    setError(null);
    setIsListening(false);
    setStatus("idle");
  }, [syncWords]);

  const displayTranscript = [transcript, liveTranscript]
    .filter(Boolean)
    .join(transcript && liveTranscript ? " " : "");

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
    isProcessing: status === "processing",
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
