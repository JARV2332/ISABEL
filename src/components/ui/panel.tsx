import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PanelProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "accent" | "inset";
  as?: "div" | "section" | "output";
  id?: string;
  "aria-labelledby"?: string;
}

const variants = {
  default:
    "rounded-[2rem] border-2 border-border/70 bg-card/80 p-6 shadow-lg backdrop-blur-sm",
  accent:
    "rounded-[2rem] border-2 border-accent/40 bg-accent/10 p-6 shadow-[var(--human-accent-glow)]",
  inset: "human-inset rounded-[1.75rem] border-2 border-border/50 p-6",
};

export function Panel({
  children,
  className,
  variant = "default",
  as: Tag = "div",
  ...props
}: PanelProps) {
  return (
    <Tag className={cn(variants[variant], className)} {...props}>
      {children}
    </Tag>
  );
}
