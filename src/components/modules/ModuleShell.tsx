import type { CSSProperties, ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getModuleTheme } from "@/lib/module-themes";
import { cn } from "@/lib/utils";
import type { ModuleInterface, ModuleStatus } from "@/types/module";

const STATUS_LABELS: Record<ModuleStatus, string> = {
  idle: "Listo",
  active: "Activo",
  processing: "Procesando",
  error: "Error",
  disabled: "No disponible",
};

const STATUS_STYLES: Record<ModuleStatus, string> = {
  idle: "bg-muted text-muted-foreground",
  active: "bg-accent/20 text-isabel-deep-800 dark:text-accent",
  processing: "bg-isabel-indigo-100 text-isabel-indigo-800 dark:bg-isabel-indigo-950 dark:text-isabel-indigo-200",
  error: "bg-destructive/15 text-destructive",
  disabled: "bg-muted/60 text-muted-foreground",
};

export interface ModuleShellProps {
  module: ModuleInterface;
  status: ModuleStatus;
  isaResponse?: string | null;
  error?: string | null;
  children: ReactNode;
  actions?: ReactNode;
}

function ModuleLoadingSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Cargando módulo">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-40 w-full" />
      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-16 flex-1" />
        <Skeleton className="h-16 flex-1" />
      </div>
    </div>
  );
}

export function ModuleShell({
  module,
  status,
  isaResponse,
  error,
  children,
  actions,
}: ModuleShellProps) {
  const isLoading = status === "processing";
  const theme = getModuleTheme(module.id);

  return (
    <article
      aria-labelledby="module-title"
      data-high-contrast="true"
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] border-2 p-6 sm:p-10",
        "text-[var(--module-fg)] human-surface shadow-2xl drop-shadow-xl",
        "dark:[--module-fg:#f8fafc] dark:[--module-muted-fg:#cbd5e1]"
      )}
      style={
        {
          "--module-bg": "transparent",
          "--module-fg": "#061424",
          "--module-border": `${theme.accentLight}66`,
          "--module-accent": theme.accent,
          "--module-accent-fg": theme.accentFg,
          "--module-muted": "#f1f5f9",
          "--module-muted-fg": "#475569",
          "--module-gradient": theme.gradient,
          boxShadow: `${theme.glow}, 0 25px 50px -12px rgb(15 23 42 / 0.12)`,
        } as CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full blur-3xl"
        style={{ background: `${theme.accentLight}30` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-20 size-56 rounded-full blur-3xl"
        style={{ background: `${theme.accent}18` }}
      />

      <header className="relative space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: theme.accent }}
            >
              Módulo EDUKIDS · {theme.label}
            </p>
            <h1
              id="module-title"
              className="text-3xl font-extrabold tracking-tight text-[var(--module-fg)] sm:text-4xl lg:text-5xl"
            >
              {module.name}
            </h1>
          </div>
          <span
            className={cn(
              "inline-flex min-h-12 items-center rounded-full px-5 py-2 text-base font-bold",
              STATUS_STYLES[status]
            )}
            role="status"
            aria-label={`Estado: ${STATUS_LABELS[status]}`}
          >
            {isLoading ? (
              <span className="mr-2 inline-block size-2.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
            ) : null}
            {STATUS_LABELS[status]}
          </span>
        </div>
        <p className="max-w-3xl text-lg leading-relaxed text-[var(--module-muted-fg)] sm:text-xl">
          {module.description}
        </p>
      </header>

      {isaResponse && !error && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="relative mt-6 rounded-[1.75rem] border-2 px-6 py-4 text-lg font-medium text-[var(--module-fg)] shadow-md"
          style={{
            borderColor: `${theme.accent}55`,
            background: `${theme.accentLight}18`,
          }}
        >
          <span
            className="mb-1 block text-xs font-bold uppercase tracking-wider"
            style={{ color: theme.accent }}
          >
            ISA
          </span>
          {isaResponse}
        </div>
      )}

      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {isaResponse}
      </div>

      {error && (
        <div
          role="alert"
          className="relative mt-6 rounded-[1.75rem] border-2 border-destructive/40 bg-destructive/10 px-6 py-4 text-lg font-semibold text-destructive shadow-md"
        >
          {error}
        </div>
      )}

      <div className="relative mt-8 sm:mt-10">
        {isLoading ? <ModuleLoadingSkeleton /> : children}
      </div>

      {actions && !isLoading && (
        <footer className="relative mt-8 flex flex-col gap-4 border-t-2 border-[var(--module-border)]/60 pt-8 sm:flex-row sm:flex-wrap">
          {actions}
        </footer>
      )}
    </article>
  );
}
