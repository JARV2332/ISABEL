"use client";

import {
  Delete,
  Eraser,
  Hand,
  Keyboard,
  Mic,
  PenLine,
  Plus,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { HandwritingTextInput } from "@/components/modules/hearing/HandwritingTextInput";
import { ModuleShell } from "@/components/modules/ModuleShell";
import { SignCaptureCamera } from "@/components/modules/shared/SignCaptureCamera";
import { SignLanguageAvatar } from "@/components/modules/shared/SignLanguageAvatar";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { TabGroup } from "@/components/ui/tab-group";
import { useHearingLogic } from "@/lib/hooks/useHearingLogic";
import { useSignCapture } from "@/lib/hooks/useSignCapture";
import { hearingModule } from "@/lib/module-registry";
import { cn } from "@/lib/utils";
import type { ModuleViewProps } from "@/types/module";

type InputMode = "microphone" | "camera";
type TextInputMode = "voice" | "keyboard" | "handwriting";

const INPUT_TABS = [
  {
    id: "microphone" as const,
    label: "Traducir mi mensaje a lengua de señas",
    icon: Hand,
    tooltip:
      "Tengo un mensaje en voz, texto o escritura a mano. ISABEL lo convertirá a lengua de señas para facilitar la comunicación.",
  },
  {
    id: "camera" as const,
    label: "Traducir señas a voz",
    icon: Volume2,
    tooltip:
      "Tengo un mensaje en lengua de señas. ISABEL lo traducirá a texto y voz para facilitar la comunicación.",
  },
];

const INPUT_METHODS = [
  {
    id: "voice" as const,
    title: "Hablar",
    description: "Usa tu voz para dictar el mensaje.",
    icon: Mic,
  },
  {
    id: "keyboard" as const,
    title: "Escribir",
    description: "Escribe aquí para traducir tu mensaje.",
    icon: Keyboard,
  },
  {
    id: "handwriting" as const,
    title: "Escribir a mano",
    description: "Dibuja o escribe a mano para traducir tu mensaje.",
    icon: PenLine,
  },
] as const;

const MESSAGE_PLACEHOLDER =
  "Tu mensaje aparecerá aquí. Puedes hablar, escribir o utilizar escritura a mano para comenzar la traducción.";

export function HearingInterface({ module = hearingModule }: ModuleViewProps) {
  const [inputMode, setInputMode] = useState<InputMode>("microphone");
  const [textInputMode, setTextInputMode] = useState<TextInputMode>("voice");
  const [manualDraft, setManualDraft] = useState("");
  const holdActiveRef = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const mic = useHearingLogic();
  const camera = useSignCapture();

  const status =
    inputMode === "microphone" ? mic.status : camera.status;
  const error = inputMode === "microphone" ? mic.error : camera.error;
  const signSequence =
    inputMode === "microphone" ? mic.signSequence : camera.signSequence;
  const output = inputMode === "microphone" ? mic.output : camera.output;
  const isaResponse =
    inputMode === "microphone" ? mic.isaResponse : camera.isaResponse;

  const clearSession = useCallback(() => {
    mic.clearSession();
    camera.clearSignCapture();
    setManualDraft("");
  }, [mic, camera]);

  const beginHold = useCallback(() => {
    if (holdActiveRef.current || mic.isProcessing) return;
    holdActiveRef.current = true;
    void mic.startListening();
  }, [mic]);

  const endHold = useCallback(() => {
    if (!holdActiveRef.current) return;
    holdActiveRef.current = false;
    mic.stopListening();
  }, [mic]);

  const handleAddManualText = useCallback(() => {
    mic.appendManualText(manualDraft);
    setManualDraft("");
  }, [mic, manualDraft]);

  const handleHandwritingRecognized = useCallback(
    (text: string) => {
      const current = mic.transcript.trim();
      const recognized = text.trim();

      if (!recognized) return;

      if (
        current &&
        recognized.toLowerCase().startsWith(current.toLowerCase())
      ) {
        const suffix = recognized.slice(current.length).trim();
        if (suffix) mic.appendManualText(suffix);
        return;
      }

      mic.appendManualText(recognized);
    },
    [mic]
  );

  const canInterpret = mic.hasInterpretText && !mic.isProcessing;

  const handleInterpret = useCallback(async () => {
    await mic.interpretTranscript();
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [mic]);

  return (
    <ModuleShell
      module={module}
      status={status}
      isaResponse={isaResponse}
      error={error}
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={clearSession}
          aria-label="Limpiar sesión"
        >
          <RotateCcw aria-hidden="true" />
          Limpiar
        </Button>
      }
    >
      <TabGroup
        options={INPUT_TABS}
        value={inputMode}
        onChange={setInputMode}
        ariaLabel="Forma de comunicación"
        className="mb-8"
      />

      {inputMode === "microphone" ? (
        <div
          id="panel-microphone"
          role="tabpanel"
          aria-labelledby="tab-microphone"
          className="space-y-6"
        >
          <section aria-labelledby="hearing-input-heading">
            <h2
              id="hearing-input-heading"
              className="mb-4 flex items-center gap-3 text-2xl font-extrabold text-[var(--module-fg)]"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/20 text-[var(--module-accent)]">
                <Hand className="size-6" aria-hidden="true" />
              </span>
              Traducir mi mensaje a lengua de señas
            </h2>
            <p className="mb-5 text-lg leading-relaxed text-[var(--module-muted-fg)]">
              Elige una de las siguientes formas para ingresar tu mensaje. ISABEL lo
              interpretará y lo convertirá automáticamente a lengua de señas.
            </p>

            <Panel variant="inset" className="mb-4 min-h-[8rem]">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--module-accent)]">
                Mensaje a traducir
              </p>

              {mic.words.length > 0 ? (
                <div
                  className="mb-3 flex flex-wrap gap-2"
                  role="list"
                  aria-label="Palabras del mensaje"
                >
                  {mic.words.map((word, index) => (
                    <span
                      key={`${word}-${index}`}
                      role="listitem"
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--module-border)] bg-[var(--module-bg)] px-3 py-1.5 text-lg font-semibold text-[var(--module-fg)]"
                    >
                      {word}
                      <button
                        type="button"
                        onClick={() => mic.removeWordAt(index)}
                        className="rounded-full p-0.5 text-[var(--module-muted-fg)] transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        aria-label={`Quitar la palabra ${word}`}
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              {mic.liveTranscript && (
                <p className="mb-2 text-lg italic text-[var(--module-muted-fg)]">
                  Escuchando: {mic.liveTranscript}
                </p>
              )}

              <div
                role="log"
                aria-live="polite"
                aria-label="Texto completo acumulado"
                className="text-xl leading-relaxed text-[var(--module-fg)]"
                tabIndex={0}
              >
                {mic.displayTranscript || (
                  <span className="text-[var(--module-muted-fg)]">
                    {MESSAGE_PLACEHOLDER}
                  </span>
                )}
              </div>
            </Panel>

            {mic.hasInterpretText && (
              <div
                className="mb-6 flex flex-wrap gap-2"
                role="group"
                aria-label="Corregir texto"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={mic.removeLastWord}
                  disabled={mic.words.length === 0 || mic.isListening}
                  aria-label="Borrar última palabra"
                >
                  <Delete aria-hidden="true" />
                  Borrar última palabra
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={mic.removeLastLetter}
                  disabled={mic.words.length === 0 || mic.isListening}
                  aria-label="Borrar última letra"
                >
                  <Eraser aria-hidden="true" />
                  Borrar última letra
                </Button>
              </div>
            )}

            <div className="mb-4">
              <p className="mb-4 text-lg font-semibold text-[var(--module-fg)]">
                Selecciona cómo deseas ingresar tu mensaje.
              </p>
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                role="radiogroup"
                aria-label="Métodos para ingresar tu mensaje"
              >
                {INPUT_METHODS.map(({ id, title, description, icon: Icon }) => {
                  const selected = textInputMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTextInputMode(id)}
                      className={cn(
                        "human-press flex min-h-[9.5rem] flex-col items-start gap-3 rounded-[1.5rem] border-2 p-5 text-left transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                        selected
                          ? "border-[var(--module-accent)] bg-[var(--module-muted)] shadow-lg ring-2 ring-[var(--module-accent)]/25"
                          : "border-[var(--module-border)] bg-[var(--module-bg)] hover:border-[var(--module-accent)]/40"
                      )}
                    >
                      <Icon
                        className="size-8 shrink-0 text-[var(--module-accent)]"
                        aria-hidden="true"
                      />
                      <span className="text-xl font-bold text-[var(--module-fg)]">
                        {title}
                      </span>
                      <span className="text-base leading-relaxed text-[var(--module-muted-fg)]">
                        {description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {textInputMode === "voice" ? (
              <div
                className="flex flex-col gap-4 sm:flex-row"
                role="group"
                aria-label="Entrada por voz"
              >
                <button
                  type="button"
                  className={cn(
                    "human-press inline-flex min-h-20 flex-1 items-center justify-center gap-3",
                    "rounded-[2rem] border-2 px-6 text-xl font-bold shadow-lg",
                    "transition-all duration-150 select-none touch-none",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                    mic.isListening
                      ? "border-accent bg-accent text-isabel-deep-950 scale-[0.98] shadow-inner"
                      : "border-transparent bg-[image:var(--module-gradient,var(--human-primary-gradient))] text-primary-foreground hover:brightness-110 dark:text-isabel-deep-950",
                    mic.isProcessing && "pointer-events-none opacity-50"
                  )}
                  aria-pressed={mic.isListening}
                  aria-label={
                    mic.isListening
                      ? "Suelta para agregar lo que dijiste"
                      : "Mantén presionado para hablar"
                  }
                  disabled={mic.isProcessing}
                  onContextMenu={(event) => event.preventDefault()}
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    beginHold();
                  }}
                  onPointerUp={(event) => {
                    event.preventDefault();
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                    endHold();
                  }}
                  onPointerCancel={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                    endHold();
                  }}
                  onLostPointerCapture={endHold}
                >
                  <Mic
                    className={cn("size-7", mic.isListening && "animate-pulse")}
                    aria-hidden="true"
                  />
                  {mic.isListening ? "Suelta para agregar…" : "Mantén para hablar"}
                </button>
              </div>
            ) : textInputMode === "keyboard" ? (
              <div className="space-y-3" role="group" aria-label="Entrada por teclado">
                <label htmlFor="manual-text-input" className="sr-only">
                  Escribir mensaje para traducir a lengua de señas
                </label>
                <textarea
                  id="manual-text-input"
                  value={manualDraft}
                  onChange={(event) => setManualDraft(event.target.value)}
                  placeholder={MESSAGE_PLACEHOLDER}
                  rows={4}
                  disabled={mic.isProcessing}
                  className={cn(
                    "w-full resize-y rounded-[1.5rem] border-2 border-[var(--module-border)]",
                    "bg-[var(--module-bg)] px-5 py-4 text-lg leading-relaxed text-[var(--module-fg)]",
                    "placeholder:text-[var(--module-muted-fg)]",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                  )}
                />
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={!manualDraft.trim() || mic.isProcessing}
                  onClick={handleAddManualText}
                  aria-label="Agregar texto escrito al mensaje"
                >
                  <Plus aria-hidden="true" />
                  Agregar texto
                </Button>
              </div>
            ) : (
              <HandwritingTextInput
                onTextRecognized={handleHandwritingRecognized}
                phraseContext={mic.transcript}
                disabled={mic.isProcessing || mic.isListening}
              />
            )}

            <Button
              type="button"
              variant="accent"
              size="lg"
              className="mt-4 min-h-16 w-full text-xl sm:w-auto"
              disabled={!canInterpret}
              onClick={() => void handleInterpret()}
              aria-label="Mostrar interpretación en lengua de señas"
            >
              <Sparkles aria-hidden="true" />
              {mic.isProcessing ? "Mostrando interpretación…" : "Mostrar interpretación"}
            </Button>
          </section>
        </div>
      ) : (
        <div
          id="panel-camera"
          role="tabpanel"
          aria-labelledby="tab-camera"
        >
          <SignCaptureCamera
            videoRef={camera.videoRef}
            canvasRef={camera.canvasRef}
            isCameraActive={camera.isCameraActive}
            isHandTracking={camera.isHandTracking}
            isModelLoading={camera.isModelLoading}
            handsDetected={camera.handsDetected}
            currentLetter={camera.currentLetter}
            currentConfidence={camera.currentConfidence}
            signBuffer={camera.signBuffer}
            signTranscript={camera.signTranscript}
            isProcessing={camera.status === "processing"}
            onStartCamera={() => void camera.startCamera()}
            onStopCamera={camera.stopCamera}
            onCaptureSign={() => void camera.captureSign()}
            onFinalizeBuffer={() => void camera.finalizeBuffer()}
          />
        </div>
      )}

      {inputMode === "microphone" && (output || signSequence) && (
        <div ref={resultsRef}>
          {signSequence && (
            <SignLanguageAvatar
              sequence={signSequence}
              displaySize="hero"
              className="mt-8"
            />
          )}

          {output && (
            <section aria-labelledby="hearing-output-heading" className="mt-8">
              <h2
                id="hearing-output-heading"
                className="mb-4 text-2xl font-extrabold text-[var(--module-fg)]"
              >
                Texto interpretado
              </h2>
              {mic.transcript && (
                <p className="mb-3 text-lg text-[var(--module-muted-fg)]">
                  Dijiste: «{mic.transcript}»
                </p>
              )}
              <Panel variant="accent" as="output">
                <p className="text-xl font-semibold leading-relaxed">{output}</p>
              </Panel>
              {mic.isaVoiceText && (
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <Button
                    type="button"
                    variant="accent"
                    disabled={mic.isLoadingTts}
                    onClick={() => void mic.replayIsaVoice()}
                    aria-label="Escuchar texto con voz ISA"
                  >
                    <Volume2 aria-hidden="true" />
                    {mic.isLoadingTts
                      ? "Generando voz…"
                      : mic.isSpeaking
                        ? "Reproduciendo…"
                        : "Escuchar audio"}
                  </Button>
                  {mic.lastAudioError && (
                    <p className="text-lg font-medium text-amber-700" role="status">
                      {mic.lastAudioError}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {inputMode === "camera" && output && (
        <>
          <section aria-labelledby="hearing-output-heading" className="mt-8">
            <h2
              id="hearing-output-heading"
              className="mb-4 text-2xl font-extrabold text-[var(--module-fg)]"
            >
              Respuesta de ISA
            </h2>
            {camera.signTranscript && (
              <p className="mb-3 text-lg text-[var(--module-muted-fg)]">
                Seña interpretada: «{camera.signTranscript}»
              </p>
            )}
            <Panel variant="accent" as="output">
              <p className="text-xl font-semibold leading-relaxed">{output}</p>
            </Panel>
            {camera.isaVoiceText && (
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Button
                  type="button"
                  variant="accent"
                  disabled={camera.isLoadingTts}
                  onClick={() => void camera.replayIsaVoice()}
                  aria-label="Escuchar respuesta con voz ISA"
                >
                  <Volume2 aria-hidden="true" />
                  {camera.isLoadingTts
                    ? "Generando voz…"
                    : camera.isSpeaking
                      ? "Reproduciendo…"
                      : "Escuchar audio"}
                </Button>
                {camera.lastAudioError && (
                  <p className="text-lg font-medium text-amber-700" role="status">
                    {camera.lastAudioError}
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </ModuleShell>
  );
}
