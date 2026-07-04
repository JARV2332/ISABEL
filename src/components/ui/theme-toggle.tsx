"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("isabel-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("isabel-theme", next ? "dark" : "light");
  };

  if (!mounted) {
    return (
      <Button type="button" variant="ghost" size="sm" className="size-9 p-0" aria-hidden="true" />
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="size-9 p-0 text-white hover:bg-isabel-deep-700"
      aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
    >
      {dark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
