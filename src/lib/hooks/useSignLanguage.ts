"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SignLanguageSequence, SignUnit } from "@/types/sign-language";

const SIGN_DISPLAY_MS = 1800;

interface UseSignLanguageOptions {
  autoPlay?: boolean;
  signDurationMs?: number;
}

export function useSignLanguage(options: UseSignLanguageOptions = {}) {
  const { autoPlay = true, signDurationMs = SIGN_DISPLAY_MS } = options;
  const timerRef = useRef<number | null>(null);

  const [sequence, setSequence] = useState<SignLanguageSequence | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSign, setCurrentSign] = useState<SignUnit | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
    setCurrentIndex(0);
    setCurrentSign(null);
  }, [clearTimer]);

  const loadSequence = useCallback(
    (next: SignLanguageSequence | null) => {
      stop();
      setSequence(next);
      if (next && autoPlay && (next.signs.length > 0 || next.avatarVideoUrl)) {
        setIsPlaying(true);
        if (next.signs.length > 0) {
          setCurrentIndex(0);
          setCurrentSign(next.signs[0]);
        }
      }
    },
    [autoPlay, stop]
  );

  const play = useCallback(() => {
    if (!sequence || sequence.signs.length === 0) return;
    setIsPlaying(true);
    setCurrentIndex(0);
    setCurrentSign(sequence.signs[0]);
  }, [sequence]);

  const pause = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
  }, [clearTimer]);

  const nextSign = useCallback(() => {
    if (!sequence) return;
    setCurrentIndex((index) => {
      const next = Math.min(index + 1, sequence.signs.length - 1);
      setCurrentSign(sequence.signs[next] ?? null);
      if (next >= sequence.signs.length - 1) setIsPlaying(false);
      return next;
    });
  }, [sequence]);

  const prevSign = useCallback(() => {
    if (!sequence) return;
    setCurrentIndex((index) => {
      const prev = Math.max(index - 1, 0);
      setCurrentSign(sequence.signs[prev] ?? null);
      return prev;
    });
  }, [sequence]);

  useEffect(() => {
    if (!isPlaying || !sequence || sequence.avatarVideoUrl) return;
    if (currentIndex >= sequence.signs.length - 1) {
      const timer = window.setTimeout(() => setIsPlaying(false), signDurationMs);
      timerRef.current = timer;
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setCurrentIndex((index) => {
        const next = index + 1;
        setCurrentSign(sequence.signs[next] ?? null);
        return next;
      });
    }, signDurationMs);

    timerRef.current = timer;
    return () => window.clearTimeout(timer);
  }, [currentIndex, isPlaying, sequence, signDurationMs]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    sequence,
    currentSign,
    currentIndex,
    totalSigns: sequence?.signs.length ?? 0,
    isPlaying,
    hasVideo: Boolean(sequence?.avatarVideoUrl),
    loadSequence,
    play,
    pause,
    stop,
    nextSign,
    prevSign,
  };
}
