"use client";

import {
  BookmarkPlus,
  Ear,
  MessageSquareText,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ModuleShell } from "@/components/modules/ModuleShell";
import { SmartBoard } from "@/components/modules/speech/SmartBoard";
import {
  EASY_READING_KEY,
  QUICK_PHRASES,
  SAVED_PHRASES_KEY,
} from "@/components/modules/speech/speech-constants";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useSpeechLogic } from "@/lib/hooks/useSpeechLogic";
import { speechModule } from "@/lib/module-registry";
import { cn } from "@/lib/utils";
import type { ModuleViewProps } from "@/types/module";

function loadSavedPhrases(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_PHRASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function loadEasyReading(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(EASY_READING_KEY) === "1";
}

export function SpeechInterface({ module = speechModule }: ModuleViewProps) {
  const speech = useSpeechLogic();
  const [easyReading, setEasyReading] = useState(false);
  const [savedPhrases, setSavedPhrases] = useState<string[]>([]);

  useEffect(() => {
    setSavedPhrases(loadSavedPhrases());
    setEasyReading(loadEasyReading());
  }, []);

  const toggleEasyReading = useCallback(() => {
    setEasyReading((prev) => {
      const next = !prev;
      window.localStorage.setItem(EASY_READING_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const handleQuickPhrase = useCallback(
    (phrase: string) => {
      speech.setMessageDraft(phrase);
    },
    [speech]
  );

  const handleSpeakForMe = useCallback(() => {
    void speech.speakForMe(speech.messageDraft);
  }, [speech]);

  const handleSavePhrase = useCallback(() => {
    const text = speech.messageDraft.trim();
    if (!text) return;

    setSavedPhrases((prev) => {
      if (prev.includes(text)) return prev;
      const next = [text, ...prev].slice(0, 12);
      window.localStorage.setItem(SAVED_PHRASES_KEY, JSON.stringify(next));
      return next;
    });
    speech.setMessageDraft("");
  }, [speech]);

  const displayConversation =
    speech.liveConversationText || speech.conversationTranscript;

  return (
    <div
      className={cn("speech-module", easyReading && "speech-easy-read")}
      data-easy-reading={easyReading ? "true" : "false"}
    >
      <ModuleShell
        module={module}
        status={speech.status}
        isaResponse={speech.isaResponse}
        error={speech.error}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={speech.clearSession}
            aria-label="Limpiar toda la sesión"
          >
            <RotateCcw aria-hidden="true" />
            Reiniciar
          </Button>
        }
      >
        <div className="speech-module-inner space-y-10">
          <p className="speech-intro max-w-3xl text-left text-lg leading-relaxed text-[var(--speech-muted,#475569)] sm:text-xl">
            Escribe, selecciona frases rápidas o usa pictogramas para que Isabel
            hable por ti.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border-2 border-[var(--speech-card-border,#F9A8D4)] bg-[var(--speech-card-bg,#FDF2F8)] px-5 py-4">
            <div>
              <p className="speech-label text-lg font-bold text-[var(--speech-fg,#0F172A)]">
                Modo lectura fácil
              </p>
              <p className="speech-body mt-1 text-base text-[var(--speech-muted,#475569)]">
                Texto más grande, más espacio y fondo crema suave.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={easyReading}
              aria-label="Activar modo lectura fácil"
              onClick={toggleEasyReading}
              className={cn(
                "human-press relative inline-flex h-14 min-w-[5.5rem] items-center rounded-full border-2 px-2 transition-colors",
                easyReading
                  ? "border-[#DB2777] bg-[#DB2777]"
                  : "border-[#F9A8D4] bg-white"
              )}
            >
              <span
                className={cn(
                  "inline-block size-10 rounded-full bg-white shadow-md transition-transform",
                  easyReading && "translate-x-[calc(100%-0.25rem)] bg-[#FDF2F8]"
                )}
                aria-hidden="true"
              />
              <span className="sr-only">
                {easyReading ? "Activado" : "Desactivado"}
              </span>
            </button>
          </div>

          {/* Sección 1: Frases rápidas */}
          <section aria-labelledby="speech-quick-phrases-heading">
            <h2
              id="speech-quick-phrases-heading"
              className="speech-heading mb-2 flex items-center gap-3 text-2xl font-extrabold text-[var(--speech-fg,#0F172A)]"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#DB2777] text-white">
                <MessageSquareText className="size-6" aria-hidden="true" />
              </span>
              Frases rápidas
            </h2>
            <p className="speech-body mb-5 max-w-2xl text-left text-lg leading-relaxed text-[var(--speech-muted,#475569)]">
              Toca una frase para usarla. Luego presiona «Hablar por mí».
            </p>

            <div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label="Frases de uso frecuente"
            >
              {QUICK_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  role="listitem"
                  onClick={() => handleQuickPhrase(phrase)}
                  className={cn(
                    "speech-phrase-btn human-press rounded-[1.25rem] border-2 border-[var(--speech-card-border,#F9A8D4)]",
                    "bg-[var(--speech-card-bg,#FDF2F8)] px-5 py-4 text-left font-bold text-[var(--speech-fg,#0F172A)]",
                    "transition-all hover:border-[#DB2777] hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#DB2777]/30",
                    speech.messageDraft === phrase &&
                      "border-[#DB2777] ring-2 ring-[#DB2777]/25"
                  )}
                >
                  {phrase}
                </button>
              ))}
            </div>

            {savedPhrases.length > 0 && (
              <div className="mt-6">
                <p className="speech-label mb-3 text-base font-bold text-[var(--speech-muted,#475569)]">
                  Tus frases guardadas
                </p>
                <div className="flex flex-wrap gap-2">
                  {savedPhrases.map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => handleQuickPhrase(phrase)}
                      className="speech-phrase-btn human-press rounded-full border-2 border-[#F9A8D4] bg-white px-4 py-2 text-base font-semibold text-[var(--speech-fg,#0F172A)] hover:border-[#DB2777]"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Sección 2: Escribir mensaje */}
          <section aria-labelledby="speech-write-heading">
            <h2
              id="speech-write-heading"
              className="speech-heading mb-2 flex items-center gap-3 text-2xl font-extrabold text-[var(--speech-fg,#0F172A)]"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#DB2777] text-white">
                <Type className="size-6" aria-hidden="true" />
              </span>
              Escribir mensaje
            </h2>
            <p className="speech-body mb-5 max-w-2xl text-left text-lg leading-relaxed text-[var(--speech-muted,#475569)]">
              Escribe lo que quieres decir. Isabel lo leerá en voz alta.
            </p>

            <label htmlFor="speech-message-input" className="sr-only">
              Mensaje para que Isabel hable por ti
            </label>
            <textarea
              id="speech-message-input"
              value={speech.messageDraft}
              onChange={(event) => speech.setMessageDraft(event.target.value)}
              placeholder="Escribe aquí lo que quieres decir..."
              rows={5}
              disabled={speech.isBusy}
              className={cn(
                "speech-input w-full resize-y rounded-[1.5rem] border-2 border-[#F9A8D4]",
                "bg-white px-5 py-4 text-lg leading-relaxed text-[var(--speech-fg,#0F172A)]",
                "placeholder:text-[var(--speech-muted,#475569)]",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#DB2777]/30"
              )}
            />

            <div
              className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
              role="group"
              aria-label="Acciones del mensaje"
            >
              <Button
                type="button"
                size="lg"
                disabled={!speech.messageDraft.trim() || speech.isBusy}
                onClick={handleSpeakForMe}
                aria-label="Hablar por mí — Isabel leerá el mensaje en voz alta"
                className="speech-primary-btn min-h-[3.5rem] flex-1 bg-[#DB2777] text-lg font-bold text-white hover:bg-[#BE185D] sm:flex-[2]"
              >
                <Sparkles aria-hidden="true" />
                {speech.isBusy ? "Hablando…" : "Hablar por mí"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="speech-secondary-btn min-h-[3.5rem] flex-1 border-[#F9A8D4]"
                onClick={speech.clearMessage}
                disabled={!speech.messageDraft && !speech.output}
                aria-label="Limpiar mensaje"
              >
                <RotateCcw aria-hidden="true" />
                Limpiar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="speech-secondary-btn min-h-[3.5rem] flex-1 border-[#F9A8D4]"
                onClick={handleSavePhrase}
                disabled={!speech.messageDraft.trim()}
                aria-label="Guardar frase para uso rápido"
              >
                <BookmarkPlus aria-hidden="true" />
                Guardar frase
              </Button>
            </div>

            {speech.output && (
              <Panel
                variant="accent"
                className="mt-6 border-2 border-[#F9A8D4] bg-[#FDF2F8]"
                as="output"
              >
                <p className="speech-label mb-2 text-sm font-bold text-[#DB2777]">
                  Último mensaje hablado
                </p>
                <p className="speech-body text-xl font-semibold leading-relaxed text-[var(--speech-fg,#0F172A)]">
                  {speech.output}
                </p>
              </Panel>
            )}

            <details className="mt-6 rounded-[1.5rem] border-2 border-[#F9A8D4] bg-[#FDF2F8] px-5 py-4">
              <summary className="cursor-pointer text-lg font-bold text-[var(--speech-fg,#0F172A)]">
                Escribir a mano (opcional)
              </summary>
              <div className="mt-4">
                <SmartBoard
                  onTextRecognized={async (text) => {
                    speech.setMessageDraft(text);
                    await speech.speakForMe(text);
                  }}
                  isaOutput={null}
                  isProcessingIsa={speech.isBusy}
                />
              </div>
            </details>
          </section>

          {/* Sección 3: Modo conversación */}
          <section aria-labelledby="speech-conversation-heading">
            <h2
              id="speech-conversation-heading"
              className="speech-heading mb-2 flex items-center gap-3 text-2xl font-extrabold text-[var(--speech-fg,#0F172A)]"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#DB2777] text-white">
                <Ear className="size-6" aria-hidden="true" />
              </span>
              Modo conversación
            </h2>
            <p className="speech-body mb-5 max-w-2xl text-left text-lg leading-relaxed text-[var(--speech-muted,#475569)]">
              Activa el micrófono para transcribir lo que otra persona responde.
            </p>

            <div
              className="flex flex-col gap-4 sm:flex-row"
              role="group"
              aria-label="Escuchar respuesta de otra persona"
            >
              <Button
                type="button"
                variant={speech.isListening ? "outline" : "default"}
                size="lg"
                className={cn(
                  "min-h-[3.5rem] flex-1 text-lg font-bold",
                  !speech.isListening &&
                    "bg-[#DB2777] text-white hover:bg-[#BE185D]"
                )}
                onClick={
                  speech.isListening
                    ? speech.stopConversationListen
                    : () => void speech.startConversationListen()
                }
                aria-pressed={speech.isListening}
                aria-label={
                  speech.isListening
                    ? "Detener escucha de respuesta"
                    : "Escuchar respuesta con micrófono"
                }
              >
                {speech.isListening ? (
                  <>
                    <MicOff aria-hidden="true" />
                    Detener escucha
                  </>
                ) : (
                  <>
                    <Mic aria-hidden="true" />
                    Escuchar respuesta
                  </>
                )}
              </Button>
            </div>

            <Panel variant="inset" className="mt-5 min-h-[8rem] border-2 border-[#F9A8D4] bg-white">
              <p className="speech-label mb-3 text-sm font-bold text-[#DB2777]">
                Respuesta escuchada
              </p>
              <div
                role="log"
                aria-live="polite"
                aria-atomic="true"
                aria-label="Texto transcrito de la otra persona"
                className="speech-conversation-text text-2xl font-semibold leading-relaxed text-[var(--speech-fg,#0F172A)]"
                tabIndex={0}
              >
                {displayConversation || (
                  <span className="text-xl font-normal text-[var(--speech-muted,#475569)]">
                    {speech.isListening
                      ? "Escuchando… el texto aparecerá aquí."
                      : "Toca «Escuchar respuesta» para transcribir lo que diga la otra persona."}
                  </span>
                )}
              </div>
            </Panel>

            {speech.lastAudioError && (
              <p className="mt-3 text-base font-medium text-[var(--speech-muted,#475569)]" role="status">
                {speech.lastAudioError}
              </p>
            )}
          </section>
        </div>
      </ModuleShell>
    </div>
  );
}
