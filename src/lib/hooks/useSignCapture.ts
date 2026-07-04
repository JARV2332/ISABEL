"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useModuleN8n } from "@/lib/hooks/useModuleN8n";
import type { ModuleStatus } from "@/types/module";

function captureFrame(video: HTMLVideoElement): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width === 0) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
  return dataUrl.split(",")[1] ?? null;
}

export function useSignCapture() {
  const { toast } = useToast();
  const { submit } = useModuleN8n("hearing");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<ModuleStatus>("idle");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [signTranscript, setSignTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);

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
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo acceder a la cámara";
      setError(message);
      setStatus("error");
      toast({
        title: "Cámara no disponible",
        description: "Permite el acceso a la cámara en tu navegador.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const captureSign = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isCameraActive) {
      toast({
        title: "Activa la cámara primero",
        description: "Necesitas encender la cámara para capturar señas.",
        variant: "destructive",
      });
      return null;
    }

    const frame = captureFrame(video);
    if (!frame) {
      toast({
        title: "Error al capturar",
        description: "No se pudo obtener la imagen de la cámara.",
        variant: "destructive",
      });
      return null;
    }

    setStatus("processing");
    setError(null);

    try {
      const response = await submit({
        event: "hearing.sign-capture",
        data: {
          videoFrame: frame,
          format: "jpeg",
          input: "captura de señas por cámara",
        },
      });

      const text = response.output ?? "";
      setSignTranscript(text);
      setStatus("active");

      if (text) {
        toast({
          title: "Seña reconocida",
          description: text,
          variant: "success",
        });
      }

      return text;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al reconocer la seña";
      setError(message);
      setStatus("error");
      toast({
        title: "Error en reconocimiento",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  }, [isCameraActive, submit, toast]);

  const clearSignCapture = useCallback(() => {
    setSignTranscript("");
    setError(null);
    setStatus(isCameraActive ? "active" : "idle");
  }, [isCameraActive]);

  return {
    videoRef,
    status,
    isCameraActive,
    signTranscript,
    error,
    startCamera,
    stopCamera,
    captureSign,
    clearSignCapture,
  };
}
