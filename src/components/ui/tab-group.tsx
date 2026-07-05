"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface TabGroupProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function TabGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: TabGroupProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-3 rounded-[2rem] border-2 border-border/60 bg-muted/50 p-2 shadow-inner",
        className
      )}
    >
      {options.map(({ id, label, icon: Icon }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => onChange(id)}
            className={cn(
              "human-press flex min-h-16 flex-1 items-center justify-center gap-2.5",
              "rounded-[1.5rem] px-5 text-lg font-bold transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
              selected
                ? "bg-[image:var(--module-gradient,var(--human-primary-gradient))] text-primary-foreground shadow-lg dark:text-white"
                : "bg-transparent text-muted-foreground hover:bg-card/80 hover:text-foreground"
            )}
          >
            {Icon && <Icon className="size-6 shrink-0" aria-hidden="true" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
