"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  glossToBml,
  sequenceToBml,
  PERFORMS_PLAYER_PATH,
} from "@/lib/services/performs-bml";
import { withBasePath } from "@/lib/base-path";
import type { SignLanguageSequence, SignUnit } from "@/types/sign-language";

const LOAD_TIMEOUT_MS = 28000;

interface UsePerformsAvatarOptions {
  playerPath?: string;
}

export function usePerformsAvatar(options: UsePerformsAvatarOptions = {}) {
  const playerPath = options.playerPath ?? withBasePath(PERFORMS_PLAYER_PATH);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadTimeoutRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKeyState, setReloadKey] = useState(0);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current !== null) {
      window.clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.source !== "isabel-performs") return;

      if (event.data.type === "READY") {
        clearLoadTimeout();
        setIsReady(true);
        setHasError(false);
        setErrorMessage(null);
      }

      if (event.data.type === "ERROR") {
        clearLoadTimeout();
        setHasError(true);
        setIsReady(false);
        setErrorMessage(
          typeof event.data.message === "string"
            ? event.data.message
            : "Error al cargar el avatar 3D"
        );
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [reloadKeyState, clearLoadTimeout]);

  useEffect(() => {
    clearLoadTimeout();
    setIsReady(false);
    setHasError(false);
    setErrorMessage(null);

    loadTimeoutRef.current = window.setTimeout(() => {
      setHasError(true);
      setErrorMessage(
        "El avatar tardó demasiado en cargar. Comprueba tu conexión e intenta de nuevo."
      );
    }, LOAD_TIMEOUT_MS);

    return clearLoadTimeout;
  }, [reloadKeyState, clearLoadTimeout]);

  const postToPlayer = useCallback(
    (message: Record<string, unknown>) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(
        { source: "isabel-parent", ...message },
        "*"
      );
    },
    []
  );

  const playSign = useCallback(
    (sign: SignUnit) => {
      if (!isReady) return;
      postToPlayer({ type: "PLAY_BML", payload: glossToBml(sign.gloss, sign.label) });
    },
    [isReady, postToPlayer]
  );

  const playSequence = useCallback(
    (sequence: SignLanguageSequence) => {
      if (!isReady || sequence.signs.length === 0) return;
      postToPlayer({ type: "PLAY_BML", payload: sequenceToBml(sequence.signs) });
    },
    [isReady, postToPlayer]
  );

  const retry = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const handleIframeError = useCallback(() => {
    clearLoadTimeout();
    setHasError(true);
    setIsReady(false);
    setErrorMessage("No se pudo cargar el reproductor del avatar.");
  }, [clearLoadTimeout]);

  return {
    iframeRef,
    playerSrc: `${playerPath}?v=4&r=${reloadKeyState}`,
    isReady,
    hasError,
    errorMessage,
    playSign,
    playSequence,
    retry,
    handleIframeError,
  };
}
