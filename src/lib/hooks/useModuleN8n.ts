"use client";

import { useCallback, useState } from "react";

import { n8nService, type N8nWebhookResponse } from "@/lib/services/n8n";
import type { ModuleId } from "@/types/module";

interface SubmitOptions {
  event: string;
  data: Record<string, unknown>;
}

export function useModuleN8n(moduleId: ModuleId) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async ({ event, data }: SubmitOptions): Promise<N8nWebhookResponse> => {
      setIsSubmitting(true);
      try {
        return await n8nService.triggerWebhook(moduleId, {
          event,
          moduleId,
          data,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [moduleId]
  );

  return { submit, isSubmitting };
}
