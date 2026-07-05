"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Reproduce voz ISA vía POST /api/tts (ElevenLabs en servidor).
 */
export function useIsaAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTts, setIsLoadingTts] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const unlockAudio = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const Ctx =
          typeof window !== "undefined"
            ? window.AudioContext ||
              (window as Window & { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext
            : null;
        if (Ctx) audioContextRef.current = new Ctx();
      }
      void audioContextRef.current?.resume();
    } catch {
      /* ignore */
    }
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakBrowser = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const playBlob = useCallback(
    async (blob: Blob, fallbackText: string) => {
      stop();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        speakBrowser(fallbackText);
      };
      try {
        await audio.play();
      } catch {
        URL.revokeObjectURL(url);
        speakBrowser(fallbackText);
        setLastError("Toca «Escuchar voz ISA» para reproducir ElevenLabs");
      }
    },
    [speakBrowser, stop]
  );

  const requestTts = useCallback(
    async (text: string) => {
      if (!text.trim()) return false;

      unlockAudio();
      setIsLoadingTts(true);
      setLastError(null);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });

        if (!response.ok) {
          const err = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          setLastError(err.error ?? "ElevenLabs no respondió");
          speakBrowser(text);
          return false;
        }

        const blob = await response.blob();
        await playBlob(blob, text);
        return true;
      } catch {
        setLastError("Error de conexión con /api/tts");
        speakBrowser(text);
        return false;
      } finally {
        setIsLoadingTts(false);
      }
    },
    [playBlob, speakBrowser, unlockAudio]
  );

  const speak = useCallback(
    async (
      text: string,
      options?: { audioUrl?: string | null; useElevenLabs?: boolean }
    ) => {
      if (options?.useElevenLabs !== false) {
        const ok = await requestTts(text);
        if (ok) return;
      }

      if (options?.audioUrl?.startsWith("http")) {
        stop();
        const audio = new Audio(options.audioUrl);
        audioRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        try {
          await audio.play();
          return;
        } catch {
          /* fall through */
        }
      }

      if (text) speakBrowser(text);
    },
    [requestTts, speakBrowser, stop]
  );

  return {
    isSpeaking,
    isLoadingTts,
    lastError,
    unlockAudio,
    speak,
    requestTts,
    stop,
  };
}
