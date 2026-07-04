"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Reproduce voz de ISA desde audioUrl (ElevenLabs vía n8n) o fallback TTS del navegador.
 */
export function useIsaAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

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

  const speak = useCallback(
    async (text: string, audioUrl?: string | null) => {
      stop();

      if (audioUrl) {
        setLastAudioUrl(audioUrl);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setIsSpeaking(false);
          speakBrowser(text);
        };
        try {
          await audio.play();
          return;
        } catch {
          speakBrowser(text);
          return;
        }
      }

      if (text) speakBrowser(text);
    },
    [speakBrowser, stop]
  );

  const requestTts = useCallback(
    async (text: string) => {
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          speakBrowser(text);
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        await speak(text, url);
        URL.revokeObjectURL(url);
      } catch {
        speakBrowser(text);
      }
    },
    [speak, speakBrowser]
  );

  return {
    isSpeaking,
    lastAudioUrl,
    speak,
    requestTts,
    stop,
  };
}
