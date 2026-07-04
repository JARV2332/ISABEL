"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ModuleInterface, ModuleStatus } from "@/types/module";

/** Esquema de alto contraste aplicado dentro de cada módulo */
const HIGH_CONTRAST_SCHEME = [
  "[--module-bg:#ffffff]",
  "[--module-fg:#030a12]",
  "[--module-border:#0b1f3a]",
  "[--module-accent:#0891b2]",
  "[--module-accent-fg:#ffffff]",
  "[--module-muted:#e8edf4]",
  "[--module-muted-fg:#1e4270]",
  "dark:[--module-bg:#030a12]",
  "dark:[--module-fg:#f8fafc]",
  "dark:[--module-border:#67e8f9]",
  "dark:[--module-accent:#22d3ee]",
  "dark:[--module-accent-fg:#030a12]",
  "dark:[--module-muted:#0b1f3a]",
  "dark:[--module-muted-fg:#c5d3e3]",
].join(" ");

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
    <div className="space-y-4" aria-busy="true" aria-label="Cargando módulo">
      <Skeleton className="h-12 w-full bg-[var(--module-muted)]" />
      <Skeleton className="h-32 w-full bg-[var(--module-muted)]" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32 bg-[var(--module-muted)]" />
        <Skeleton className="h-10 w-32 bg-[var(--module-muted)]" />
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

  return (
    <article
      aria-labelledby="module-title"
      data-high-contrast="true"
      className={cn(
        "rounded-xl border-2 p-6 sm:p-8",
        "bg-[var(--module-bg)] text-[var(--module-fg)] border-[var(--module-border)]",
        HIGH_CONTRAST_SCHEME
      )}
    >
      <header className="space-y-2">
        <h1
          id="module-title"
          className="text-2xl font-bold tracking-tight text-[var(--module-fg)] sm:text-3xl"
        >
          {module.name}
        </h1>
        <p className="max-w-2xl text-base text-[var(--module-muted-fg)]">
          {module.description}
        </p>
      </header>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {isaResponse}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          {error}
        </div>
      )}

      <div className="mt-8">
        {isLoading ? <ModuleLoadingSkeleton /> : children}
      </div>

      {actions && !isLoading && (
        <footer className="mt-6 flex flex-wrap gap-3 border-t border-[var(--module-border)] pt-6">
          {actions}
        </footer>
      )}
    </article>
  );
}
