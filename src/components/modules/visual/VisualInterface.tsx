"use client";

import {
  Eye,
  FileText,
  FileUp,
  MapPin,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ModuleShell } from "@/components/modules/ModuleShell";
import { SpaceGuidePanel } from "@/components/modules/visual/SpaceGuidePanel";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { TabGroup } from "@/components/ui/tab-group";
import { getSpaceById, getSpaceSectionText } from "@/lib/data/accessibility-spaces";
import { useVisualLogic } from "@/lib/hooks/useVisualLogic";
import { visualModule } from "@/lib/module-registry";
import { cn } from "@/lib/utils";
import type { ModuleViewProps } from "@/types/module";

type InputMode = "text" | "pdf" | "spaces";

const INPUT_TABS = [
  { id: "spaces" as const, label: "Espacios", icon: MapPin },
  { id: "text" as const, label: "Texto", icon: FileText },
  { id: "pdf" as const, label: "PDF", icon: FileUp },
];

export function VisualInterface({ module = visualModule }: ModuleViewProps) {
  const searchParams = useSearchParams();
  const [inputMode, setInputMode] = useState<InputMode>("spaces");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deepLinkHandled = useRef(false);

  const visual = useVisualLogic();
  const { processText } = visual;

  useEffect(() => {
    const espacio = searchParams.get("espacio");
    if (!espacio || deepLinkHandled.current) return;
    const space = getSpaceById(espacio);
    if (!space) return;
    deepLinkHandled.current = true;
    setInputMode("spaces");
    setSelectedSpaceId(space.id);
    void processText(getSpaceSectionText(space, 0), {
      spaceId: space.id,
      sectionId: space.sections[0]?.id,
    });
  }, [searchParams, processText]);

  const handlePdfChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void visual.processPdfFile(file);
      event.target.value = "";
    },
    [visual]
  );

  const handleReadSpace = useCallback(
    async (
      text: string,
      options: { spaceId: string; sectionId?: string; silent?: boolean }
    ) => {
      await visual.processText(text, options);
    },
    [visual]
  );

  const busy = visual.isProcessing;

  return (
    <ModuleShell
      module={module}
      status={visual.status}
      isaResponse={visual.isaResponse}
      error={visual.error}
      actions={
        <>
          {inputMode === "text" && (
            <Button
              type="button"
              variant="accent"
              size="lg"
              disabled={busy || !visual.input.trim()}
              onClick={() => void visual.processText(visual.input)}
              aria-label="Procesar texto y leer en voz alta"
            >
              <Volume2 aria-hidden="true" />
              Leer con ISA
            </Button>
          )}
          {visual.isSpeaking && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={visual.stopSpeaking}
              aria-label="Detener lectura en voz alta"
            >
              <VolumeX aria-hidden="true" />
              Detener voz
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              visual.clearSession();
              setSelectedSpaceId(null);
            }}
            aria-label="Limpiar texto y respuesta"
          >
            <RotateCcw aria-hidden="true" />
            Limpiar
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section aria-labelledby="visual-input-heading">
          <h2
            id="visual-input-heading"
            className="mb-4 flex items-center gap-3 text-2xl font-extrabold text-[var(--module-fg)]"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/20 text-[var(--module-accent)]">
              <Eye className="size-6" aria-hidden="true" />
            </span>
            {inputMode === "spaces" ? "Orientación en espacios" : "Lectura accesible"}
          </h2>
          <p className="mb-5 text-lg leading-relaxed text-[var(--module-muted-fg)]">
            {inputMode === "spaces" ? (
              <>
                Simula estar en un salón, clínica, biblioteca u otro lugar. ISA
                describe mobiliario, accesibilidad y cómo pedir ayuda en voz
                alta.
              </>
            ) : (
              <>
                Escribe, pega texto o sube un PDF. ISA lo leerá{" "}
                <span className="font-bold text-[var(--module-fg)]">completo</span>{" "}
                en voz alta con ElevenLabs, sin resumir.
              </>
            )}
          </p>

          <TabGroup
            options={INPUT_TABS}
            value={inputMode}
            onChange={setInputMode}
            ariaLabel="Forma de ingresar contenido"
            className="mb-6"
          />

          {inputMode === "spaces" ? (
            <div
              id="panel-spaces"
              role="tabpanel"
              aria-labelledby="tab-spaces"
            >
              <SpaceGuidePanel
                busy={busy}
                isSpeaking={visual.isSpeaking}
                selectedSpaceId={selectedSpaceId}
                onSelectSpace={setSelectedSpaceId}
                onRead={handleReadSpace}
              />
            </div>
          ) : inputMode === "text" ? (
            <div
              id="panel-text"
              role="tabpanel"
              aria-labelledby="tab-text"
            >
              <label htmlFor="visual-text-input" className="sr-only">
                Contenido a leer
              </label>
              <textarea
                id="visual-text-input"
                value={visual.input}
                onChange={(event) => visual.setInput(event.target.value)}
                rows={8}
                disabled={busy}
                placeholder="Escribe o pega el texto aquí…"
                className={cn(
                  "w-full resize-y rounded-[1.5rem] border-2 border-[var(--module-border)]",
                  "bg-[var(--module-bg)] p-5 text-lg leading-relaxed text-[var(--module-fg)]",
                  "placeholder:text-[var(--module-muted-fg)]",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                )}
              />
            </div>
          ) : (
            <div
              id="panel-pdf"
              role="tabpanel"
              aria-labelledby="tab-pdf"
              className="space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                aria-hidden="true"
                onChange={handlePdfChange}
              />

              <Panel
                variant="inset"
                className={cn(
                  "flex min-h-[12rem] flex-col items-center justify-center gap-4 text-center",
                  busy && "opacity-70"
                )}
              >
                <FileUp
                  className="size-12 text-[var(--module-accent)]"
                  aria-hidden="true"
                />
                <p className="max-w-md text-lg text-[var(--module-fg)]">
                  {visual.isExtractingPdf
                    ? "Extrayendo texto del PDF…"
                    : visual.pdfFileName
                      ? `Archivo cargado: ${visual.pdfFileName}`
                      : "Selecciona un PDF para que ISA lo lea en voz alta."}
                </p>
                <Button
                  type="button"
                  variant="accent"
                  size="lg"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Subir archivo PDF para lectura en voz alta"
                >
                  <FileUp aria-hidden="true" />
                  {visual.isExtractingPdf ? "Procesando PDF…" : "Subir PDF"}
                </Button>
                <p className="text-sm text-[var(--module-muted-fg)]">
                  Máximo 10 MB · Solo PDF con texto seleccionable
                </p>
              </Panel>

              {visual.input && visual.pdfFileName && (
                <Panel variant="inset">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--module-accent)]">
                    Texto extraído del PDF
                  </p>
                  <p className="max-h-48 overflow-y-auto text-base leading-relaxed text-[var(--module-fg)]">
                    {visual.input.length > 600
                      ? `${visual.input.slice(0, 600)}…`
                      : visual.input}
                  </p>
                </Panel>
              )}
            </div>
          )}
        </section>

        {visual.output && (
          <section aria-labelledby="visual-output-heading">
            <h2
              id="visual-output-heading"
              className="mb-4 text-2xl font-extrabold text-[var(--module-fg)]"
            >
              Contenido leído
            </h2>
            <Panel variant="accent" as="output">
              <p className="max-h-64 overflow-y-auto text-xl font-semibold leading-relaxed whitespace-pre-wrap">
                {visual.output.length > 2000
                  ? `${visual.output.slice(0, 2000)}…`
                  : visual.output}
              </p>
            </Panel>
            {(visual.isSpeaking || visual.isLoadingTts || visual.readProgress) && (
              <p
                role="status"
                className="mt-3 text-lg font-medium text-[var(--module-accent)]"
              >
                {visual.readProgress ??
                  (visual.isLoadingTts
                    ? "Generando voz…"
                    : "Leyendo en voz alta…")}
              </p>
            )}
          </section>
        )}
      </div>
    </ModuleShell>
  );
}
