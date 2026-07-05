"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  configured: boolean;
  envVars: string[];
  docsPath: string;
}

export function IntegrationsStatusPanel() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data: { services?: ServiceItem[] }) => {
        setServices(data.services ?? []);
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const ready = services.filter((s) => s.configured).length;

  return (
    <section
      aria-labelledby="integrations-status-heading"
      className="rounded-xl border-2 border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/30 sm:p-6"
    >
      <h2
        id="integrations-status-heading"
        className="mb-2 text-lg font-semibold text-foreground"
      >
        Estado de integraciones ({ready}/{services.length})
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Solo las marcadas en verde están usando tu cuenta real. Configura el resto
        en <code className="text-xs">.env.local</code> — guía:{" "}
        <a
          href="https://github.com/JARV2332/ISABEL/blob/main/docs/SETUP-CUENTAS.md"
          className="font-medium text-isabel-indigo-600 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          SETUP-CUENTAS.md
          <ExternalLink className="ml-1 inline size-3" aria-hidden="true" />
        </a>
      </p>

      <ul className="space-y-2" role="list">
        {services.map((service) => (
          <li
            key={service.id}
            className="flex flex-wrap items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            {service.configured ? (
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <div>
              <span className="font-medium">{service.name}</span>
              <span className="text-muted-foreground">
                {" "}
                — {service.configured ? "Conectado" : "Falta configurar"}
              </span>
              {!service.configured && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Variables: {service.envVars.join(", ")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
