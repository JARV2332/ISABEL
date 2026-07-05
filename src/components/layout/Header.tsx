"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Ear,
  Mic,
  Eye,
  Accessibility,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

import { enabledModules } from "@/components/modules";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getModuleTheme } from "@/lib/module-themes";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Ear,
  Mic,
  Eye,
  Accessibility,
};

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/90 text-foreground shadow-lg backdrop-blur-md dark:bg-slate-950/90">
      <div className="mx-auto flex h-[4.5rem] max-w-content items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/40"
          aria-label="ISABEL - Inicio, estación de accesibilidad"
        >
          <Image
            src="/logo-icon.png"
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-xl shadow-md"
            priority
          />
          <span className="hidden text-lg font-extrabold tracking-tight text-foreground sm:inline">
            ISABEL
          </span>
        </Link>

        <nav
          className="hidden md:block"
          aria-label="Navegación principal de módulos"
        >
          <ul className="flex items-center gap-2" role="list">
            {enabledModules.map((module) => {
              const Icon = iconMap[module.icon];
              const isActive = pathname.startsWith(module.route);
              const theme = getModuleTheme(module.id);

              return (
                <li key={module.id}>
                  <Link
                    href={module.route}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-12 items-center gap-2 rounded-[1.25rem] px-4 py-2 text-sm font-bold transition-all human-press",
                      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
                      !isActive && "text-muted-foreground hover:bg-muted/80"
                    )}
                    style={
                      isActive
                        ? {
                            background: theme.gradient,
                            color: theme.accentFg,
                            boxShadow: theme.glow,
                          }
                        : undefined
                    }
                  >
                    {Icon && (
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>{module.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
        </div>

        <button
          type="button"
          className="human-press inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl text-foreground hover:bg-muted md:hidden"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? (
            <X className="size-6" aria-hidden="true" />
          ) : (
            <Menu className="size-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          className="border-t border-border/60 bg-white dark:bg-slate-950 md:hidden"
          aria-label="Navegación móvil de módulos"
        >
          <ul className="flex flex-col gap-2 p-4" role="list">
            {enabledModules.map((module) => {
              const Icon = iconMap[module.icon];
              const isActive = pathname.startsWith(module.route);
              const theme = getModuleTheme(module.id);

              return (
                <li key={module.id}>
                  <Link
                    href={module.route}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold human-press",
                      !isActive && "text-muted-foreground hover:bg-muted"
                    )}
                    style={
                      isActive
                        ? {
                            background: theme.gradient,
                            color: theme.accentFg,
                          }
                        : undefined
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {Icon && (
                      <Icon className="size-5 shrink-0" aria-hidden="true" />
                    )}
                    <span>{module.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
