"use client";

import { Lightbulb, Radio, RefreshCw, Siren } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIotControl } from "@/lib/hooks/useIotControl";
import { cn } from "@/lib/utils";

const LED_COLORS: Record<string, string> = {
  green: "bg-emerald-500 shadow-emerald-500/50",
  red: "bg-red-500 shadow-red-500/50 animate-pulse",
  yellow: "bg-amber-400 shadow-amber-400/50",
  off: "bg-slate-500",
};

export function IotPanel({ className }: { className?: string }) {
  const iot = useIotControl();

  return (
    <section
      aria-labelledby="iot-panel-heading"
      className={cn(
        "rounded-xl border-2 border-isabel-deep-700/20 bg-card p-4 shadow-sm sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="iot-panel-heading"
          className="flex items-center gap-2 text-lg font-semibold text-foreground"
        >
          <Radio className="size-5 text-isabel-cyan-600" aria-hidden="true" />
          Dispositivo IoT (simulado)
        </h2>

        <div
          className="flex items-center gap-2 text-sm"
          role="status"
          aria-live="polite"
        >
          <span
            className={cn(
              "inline-block size-3 rounded-full shadow-md",
              LED_COLORS[iot.led] ?? LED_COLORS.off
            )}
            aria-hidden="true"
          />
          <span>{iot.connected ? "Conectado" : "Desconectado"}</span>
        </div>
      </div>

      {iot.lastMessage && (
        <p className="mb-4 text-sm text-muted-foreground">{iot.lastMessage}</p>
      )}

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Controles IoT simulados"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={iot.isLoading}
          onClick={() => void iot.trigger("help")}
          className="min-h-10"
        >
          Ayuda
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={iot.isLoading}
          onClick={() => void iot.trigger("repeat")}
          className="min-h-10"
        >
          <RefreshCw aria-hidden="true" />
          Repetir
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={iot.isLoading}
          onClick={() => void iot.trigger("light-on")}
          className="min-h-10"
        >
          <Lightbulb aria-hidden="true" />
          Activar luz
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={iot.isLoading}
          onClick={() => void iot.trigger("emergency", "iot.emergency")}
          className="min-h-10 bg-red-600 text-white hover:bg-red-700"
        >
          <Siren aria-hidden="true" />
          Emergencia
        </Button>
      </div>
    </section>
  );
}
