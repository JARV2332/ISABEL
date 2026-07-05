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
  { id: "microphone" as const, label: "Texto a señales", icon: Hand },
  { id: "camera" as const, label: "Señas a audio", icon: Volume2 },
];

const TEXT_INPUT_TABS = [
  { id: "voice" as const, label: "Voz", icon: Mic },
  { id: "keyboard" as const, label: "Teclado", icon: Keyboard },
  { id: "handwriting" as const, label: "A mano", icon: PenLine },
];

export function HearingInterface({ module = hearingModule }: ModuleViewProps) {
  const [inputMode, setInputMode] = useState<InputMode>("microphone");
  const [textInputMode, setTextInputMode] = useState<TextInputMode>("voice");
  const [manualDraft, setManualDraft] = useState("");
  const holdActiveRef = useRef(false);

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
    mic.startListening();
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

  const canInterpret =
    mic.hasInterpretText && !mic.isListening && !mic.isProcessing;

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
        ariaLabel="Modo de entrada"
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
              Texto a señales
            </h2>
            <p className="mb-5 text-lg leading-relaxed text-[var(--module-muted-fg)]">
              <span className="font-bold text-[var(--module-fg)]">Instrucciones:</span>{" "}
              Habla manteniendo presionado el botón o escribe texto por medio de un
              teclado integrado o escritura a mano. Cuando tu frase esté lista, toca
              el botón «Interpretar» para ver las señas LSM.
            </p>

            <Panel variant="inset" className="mb-4 min-h-[8rem]">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--module-accent)]">
                Tu mensaje
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
                    Aún no hay texto. Usa voz, teclado o escritura a mano.
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

            <TabGroup
              options={TEXT_INPUT_TABS}
              value={textInputMode}
              onChange={setTextInputMode}
              ariaLabel="Forma de ingresar texto"
              className="mb-4"
            />

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
                  onMouseDown={(event) => {
                    event.preventDefault();
                    beginHold();
                  }}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onTouchStart={(event) => {
                    event.preventDefault();
                    beginHold();
                  }}
                  onTouchEnd={endHold}
                  onTouchCancel={endHold}
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
                  Escribir texto para interpretar en señas
                </label>
                <textarea
                  id="manual-text-input"
                  value={manualDraft}
                  onChange={(event) => setManualDraft(event.target.value)}
                  placeholder="Escribe aquí tu frase o palabras…"
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
              onClick={() => void mic.interpretTranscript()}
              aria-label="Interpretar texto acumulado en señas LSM"
            >
              <Sparkles aria-hidden="true" />
              {mic.isProcessing ? "Interpretando…" : "Interpretar a señales"}
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
        <>
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
        </>
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
