"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { InteractionRow, IotEventRow } from "@/types/database";
import { cn } from "@/lib/utils";

export function RecentInteractionsPanel({ className }: { className?: string }) {
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [iotEvents, setIotEvents] = useState<IotEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/interactions")
      .then((r) => r.json())
      .then((data: { interactions?: InteractionRow[]; iotEvents?: IotEventRow[] }) => {
        setInteractions(data.interactions ?? []);
        setIotEvents(data.iotEvents ?? []);
      })
      .catch(() => {
        setInteractions([]);
        setIotEvents([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = interactions.length + iotEvents.length;

  return (
    <section
      aria-labelledby="interactions-heading"
      className={cn(
        "rounded-xl border-2 border-isabel-indigo-200 bg-card p-4 shadow-sm dark:border-isabel-indigo-800 sm:p-6",
        className
      )}
    >
      <h2
        id="interactions-heading"
        className="mb-4 flex items-center gap-2 text-lg font-semibold"
      >
        <Activity className="size-5 text-isabel-indigo-600" aria-hidden="true" />
        Actividad reciente
        {!loading && (
          <span className="text-sm font-normal text-muted-foreground">
            ({total} eventos)
          </span>
        )}
      </h2>

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : total === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin interacciones aún. Usa un módulo o configura Supabase (
          <code className="text-xs">supabase/migrations/001_interactions.sql</code>
          ).
        </p>
      ) : (
        <ul className="space-y-2" role="list">
          {interactions.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
            >
              <span className="font-medium capitalize text-isabel-indigo-700 dark:text-isabel-cyan-300">
                {item.module_id}
              </span>
              <span className="text-muted-foreground"> — </span>
              {item.output_text ?? item.input_text ?? "—"}
            </li>
          ))}
          {iotEvents.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
            >
              <span className="font-medium text-amber-700 dark:text-amber-300">
                IoT: {item.action}
              </span>
              {item.led_state && (
                <span className="text-muted-foreground"> (LED {item.led_state})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
