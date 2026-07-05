"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "default" | "destructive" | "success";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 5000;

const variantStyles: Record<ToastVariant, string> = {
  default: "border-border/80 bg-card/95 text-card-foreground backdrop-blur-md",
  destructive:
    "border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20",
  success:
    "border-accent/40 bg-accent/15 text-isabel-deep-900 dark:bg-accent/10 dark:text-accent",
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="assertive"
      aria-relevant="additions"
      className="pointer-events-none fixed bottom-6 right-6 z-[200] flex w-full max-w-md flex-col gap-3 p-4"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="alert"
          className={cn(
            "pointer-events-auto flex items-start gap-4 rounded-[1.75rem] border-2 p-5 shadow-2xl drop-shadow-lg",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3",
            variantStyles[item.variant]
          )}
        >
          <div className="flex-1 space-y-1.5">
            <p className="text-lg font-bold">{item.title}</p>
            {item.description && (
              <p className="text-base leading-relaxed opacity-90">
                {item.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className={cn(
              "human-touch-target human-press flex shrink-0 items-center justify-center",
              "rounded-full border-2 border-border/60 bg-muted/50",
              "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
            )}
            aria-label={`Cerrar notificación: ${item.title}`}
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((options: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...options, id }]);
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((item) =>
      window.setTimeout(() => dismiss(item.id), TOAST_DURATION_MS)
    );

    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
}
