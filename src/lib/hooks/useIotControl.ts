"use client";

import { useCallback, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { n8nService } from "@/lib/services/n8n";
import type { N8nWebhookResponse } from "@/lib/services/n8n";

export type IotLedState = "green" | "red" | "yellow" | "off";

export function useIotControl() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  const [led, setLed] = useState<IotLedState>("green");
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const trigger = useCallback(
    async (action: string, event = "iot.action") => {
      setIsLoading(true);
      try {
        const response: N8nWebhookResponse = await n8nService.triggerWebhook(
          "iot",
          {
            event,
            moduleId: "iot",
            data: { action, input: action },
          }
        );

        const device = response.device;
        setConnected(device?.connected ?? true);
        setLed(device?.led ?? (action === "emergency" ? "red" : "green"));
        setLastMessage(
          device?.message ?? response.output ?? `Acción ${action} completada`
        );

        toast({
          title: "Dispositivo ISABEL",
          description: response.output ?? `Acción: ${action}`,
          variant: action === "emergency" ? "destructive" : "success",
        });

        return response;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al contactar IoT";
        setConnected(false);
        setLed("red");
        toast({ title: "IoT", description: message, variant: "destructive" });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    isLoading,
    connected,
    led,
    lastMessage,
    trigger,
  };
}
