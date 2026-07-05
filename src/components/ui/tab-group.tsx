"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  tooltip?: string;
}

interface TabGroupProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  /** En móvil apila las pestañas verticalmente */
  stackOnMobile?: boolean;
}

export function TabGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  stackOnMobile = false,
}: TabGroupProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-2 rounded-[2rem] border-2 border-border/60 bg-muted/50 p-2 shadow-inner sm:gap-3",
        stackOnMobile ? "flex-col sm:flex-row" : "flex-row",
        className
      )}
    >
      {options.map(({ id, label, icon: Icon, tooltip }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            title={tooltip}
            onClick={() => onChange(id)}
            className={cn(
              "human-press flex min-h-14 w-full flex-1 items-center justify-center gap-2",
              "rounded-[1.25rem] px-3 py-2.5 text-center text-sm font-bold leading-snug transition-all duration-150 sm:min-h-16 sm:gap-2.5 sm:rounded-[1.5rem] sm:px-5 sm:text-lg",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
              selected
                ? "bg-[image:var(--module-gradient,var(--human-primary-gradient))] text-primary-foreground shadow-lg dark:text-white"
                : "bg-transparent text-muted-foreground hover:bg-card/80 hover:text-foreground"
            )}
          >
            {Icon && (
              <Icon className="size-5 shrink-0 sm:size-6" aria-hidden="true" />
            )}
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
