"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

import { useToast } from "@/components/ui/toast";
import { withBasePath } from "@/lib/base-path";
import { useIsaAudio } from "@/lib/hooks/useIsaAudio";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import { signLanguageService } from "@/lib/services/sign-language";
import {
  classifyDactilologyLetter,
  drawHandOverlay,
  type HandLandmark,
  type LetterResult,
} from "@/lib/sign-language/hand-classifier";
import type { ModuleStatus } from "@/types/module";
import type { SignLanguageSequence } from "@/types/sign-language";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const STABLE_FRAMES = 7;

function captureFrame(video: HTMLVideoElement): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width === 0) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82).split(",")[1] ?? null;
}

export function useSignCapture() {
  const { toast } = useToast();
  const { submit } = useModuleN8n("hearing");
  const { speak, requestTts, isSpeaking, isLoadingTts, lastError, unlockAudio } =
    useIsaAudio();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastStableLetterRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const lastCommittedLetterRef = useRef<string | null>(null);

  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isHandTracking, setIsHandTracking] = useState(false);
  const [handsDetected, setHandsDetected] = useState(0);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [signBuffer, setSignBuffer] = useState("");
  const [signTranscript, setSignTranscript] = useState("");
  const [output, setOutput] = useState("");
  const [signSequence, setSignSequence] = useState<SignLanguageSequence | null>(
    null
  );
  const [isaResponse, setIsaResponse] = useState<string | null>(null);
  const [isaVoiceText, setIsaVoiceText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    setIsHandTracking(false);
    setHandsDetected(0);
    setCurrentLetter(null);
    setCurrentConfidence(0);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const initHandLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    setIsModelLoading(true);
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
      landmarkerRef.current = landmarker;
      return landmarker;
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  const processHandResults = useCallback(
    (results: HandLandmarkerResult, width: number, height: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      const handCount = results.landmarks?.length ?? 0;
      setHandsDetected(handCount);

      if (handCount === 0) {
        setCurrentLetter(null);
        setCurrentConfidence(0);
        stableCountRef.current = 0;
        lastStableLetterRef.current = null;
        lastCommittedLetterRef.current = null;
        return;
      }

      let bestResult: LetterResult = {
        letter: null,
        confidence: 0,
        fingers: [false, false, false, false, false],
      };
      let bestHand: HandLandmark[] | null = null;

      for (let i = 0; i < handCount; i++) {
        const hand = results.landmarks[i] as HandLandmark[];
        const handedness =
          results.handednesses?.[i]?.[0]?.categoryName ?? null;
        const result = classifyDactilologyLetter(hand, handedness);
        if (result.confidence > bestResult.confidence) {
          bestResult = result;
          bestHand = hand;
        }
      }

      if (!bestHand) return;

      setCurrentLetter(bestResult.letter);
      setCurrentConfidence(bestResult.confidence);

      drawHandOverlay(ctx, bestHand, width, height, bestResult);

      for (let i = 0; i < handCount; i++) {
        if (results.landmarks[i] !== bestHand) {
          const hand = results.landmarks[i] as HandLandmark[];
          const handedness =
            results.handednesses?.[i]?.[0]?.categoryName ?? null;
          const other = classifyDactilologyLetter(hand, handedness);
          ctx.globalAlpha = 0.35;
          drawHandOverlay(ctx, hand, width, height, other);
          ctx.globalAlpha = 1;
        }
      }

      const letter = bestResult.letter;

      if (!letter) {
        stableCountRef.current = 0;
        lastStableLetterRef.current = null;
        lastCommittedLetterRef.current = null;
        return;
      }

      if (letter === lastStableLetterRef.current) {
        stableCountRef.current += 1;
      } else {
        lastStableLetterRef.current = letter;
        stableCountRef.current = 1;
      }

      if (
        stableCountRef.current >= STABLE_FRAMES &&
        letter !== lastCommittedLetterRef.current
      ) {
        lastCommittedLetterRef.current = letter;
        setSignBuffer((prev) => {
          const next = prev + letter;
          setSignTranscript(next);
          return next;
        });
      }
    },
    []
  );

  const startHandLoop = useCallback(async () => {
    const landmarker = await initHandLandmarker();
    const video = videoRef.current;
    if (!video || !landmarker) return;

    setIsHandTracking(true);

    const tick = () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const v = videoRef.current;
      const results = landmarker.detectForVideo(v, performance.now());
      processHandResults(results, v.videoWidth, v.videoHeight);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [initHandLandmarker, processHandResults]);

  const startCamera = useCallback(async () => {
    setError(null);
    unlockAudio();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setStatus("active");
      setIsaResponse("Intérprete activo — seña frente a la cámara…");
      await startHandLoop();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo acceder a la cámara";
      setError(message);
      setStatus("error");
      toast({
        title: "Cámara no disponible",
        description: "Permite el acceso a la cámara en tu navegador.",
        variant: "destructive",
      });
    }
  }, [toast, unlockAudio, startHandLoop]);

  const interpretWithVision = useCallback(
    async (frame: string, localHint?: string) => {
      try {
        const response = await fetch(withBasePath("/api/sign-recognize"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frame, format: "jpeg", localHint }),
        });
        if (!response.ok) return null;
        const data = (await response.json()) as { output?: string | null };
        return data.output ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const processSignText = useCallback(
    async (text: string) => {
      if (!text.trim()) return null;

      setStatus("processing");
      setError(null);

      try {
        const response = await submit({
          event: "hearing.sign-capture",
          data: {
            transcript: text.trim(),
            input: text.trim(),
          },
        });

        const signs = signLanguageService.parseFromN8n(
          response as Record<string, unknown>,
          text.trim()
        );
        const isaText = (response.output ?? text.trim()).trim();

        setSignTranscript(text.trim());
        setOutput(isaText);
        setSignSequence(signs);
        setIsaVoiceText(isaText);
        setIsaResponse(`Seña interpretada: «${text.trim()}»`);
        setStatus("active");

        void speak(isaText, {
          useElevenLabs: response.elevenLabsAvailable !== false,
        });

        toast({
          title: "Seña interpretada",
          description: isaText,
          variant: "success",
        });

        return isaText;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al interpretar la seña";
        setError(message);
        setStatus("error");
        toast({
          title: "Error en intérprete",
          description: message,
          variant: "destructive",
        });
        return null;
      }
    },
    [submit, speak, toast]
  );

  const captureSign = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isCameraActive) {
      toast({
        title: "Activa la cámara primero",
        variant: "destructive",
      });
      return null;
    }

    const frame = captureFrame(video);
    if (!frame) return null;

    setStatus("processing");

    let text = signBuffer.trim();
    if (!text && currentLetter) text = currentLetter;

    const visionResult = await interpretWithVision(frame, text || undefined);
    if (visionResult) text = visionResult;

    if (!text) {
      setStatus("active");
      toast({
        title: "No se detectó seña",
        description:
          "Mantén la mano frente a la cámara y forma una letra clara (A, B, L, O, V…).",
        variant: "destructive",
      });
      return null;
    }

    return processSignText(text);
  }, [
    isCameraActive,
    signBuffer,
    currentLetter,
    interpretWithVision,
    processSignText,
    toast,
  ]);

  const finalizeBuffer = useCallback(async () => {
    const text = signBuffer.trim();
    if (!text) {
      toast({
        title: "Sin señas acumuladas",
        description: "Seña letra por letra o usa «Interpretar señas».",
        variant: "destructive",
      });
      return null;
    }
    return processSignText(text);
  }, [signBuffer, processSignText, toast]);

  const clearSignCapture = useCallback(() => {
    setSignBuffer("");
    setSignTranscript("");
    setOutput("");
    setSignSequence(null);
    setIsaResponse(isCameraActive ? "Intérprete activo — seña frente a la cámara…" : null);
    setIsaVoiceText(null);
    setError(null);
    setCurrentLetter(null);
    lastCommittedLetterRef.current = null;
    lastStableLetterRef.current = null;
    stableCountRef.current = 0;
    setStatus(isCameraActive ? "active" : "idle");
  }, [isCameraActive]);

  return {
    videoRef,
    canvasRef,
    status,
    isCameraActive,
    isHandTracking,
    isModelLoading,
    handsDetected,
    currentLetter,
    currentConfidence,
    signBuffer,
    signTranscript,
    output,
    signSequence,
    isaResponse,
    isaVoiceText,
    error,
    isSpeaking,
    isLoadingTts,
    lastAudioError: lastError,
    startCamera,
    stopCamera,
    captureSign,
    finalizeBuffer,
    clearSignCapture,
    replayIsaVoice: () =>
      isaVoiceText ? requestTts(isaVoiceText) : Promise.resolve(false),
  };
}
