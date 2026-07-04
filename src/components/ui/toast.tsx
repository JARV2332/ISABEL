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
  default: "border-border bg-card text-card-foreground",
  destructive:
    "border-destructive/50 bg-destructive/10 text-destructive dark:bg-destructive/20",
  success:
    "border-isabel-cyan-600/50 bg-isabel-cyan-50 text-isabel-deep-900 dark:bg-isabel-cyan-950 dark:text-isabel-cyan-100",
};

function ToastViewport({ toasts, onDismiss }: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="assertive"
      aria-relevant="additions"
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2 p-4 sm:bottom-6 sm:right-6"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="alert"
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
            variantStyles[item.variant]
          )}
        >
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold">{item.title}</p>
            {item.description && (
              <p className="text-sm opacity-90">{item.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Cerrar notificación: ${item.title}`}
          >
            <X className="size-4" aria-hidden="true" />
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

  const toast = useCallback(
    (options: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...options, id }]);
    },
    []
  );

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
