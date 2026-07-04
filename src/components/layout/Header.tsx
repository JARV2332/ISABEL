"use client";

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
    <header className="sticky top-0 z-50 w-full border-b border-isabel-deep-700/20 bg-isabel-deep-900 text-white shadow-md">
      <div className="mx-auto flex h-header max-w-content items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-md text-lg font-bold tracking-tight text-white transition-colors hover:text-isabel-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isabel-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-isabel-deep-900"
            aria-label="ISABEL - Inicio, estación de accesibilidad EDUKIDS"
          >
            <span className="text-isabel-cyan-400">ISABEL</span>
            <span className="ml-2 hidden text-sm font-normal text-isabel-deep-100 sm:inline">
              EDUKIDS
            </span>
          </Link>
        </div>

        <nav
          className="hidden md:block"
          aria-label="Navegación principal de módulos"
        >
          <ul className="flex items-center gap-1" role="list">
            {enabledModules.map((module) => {
              const Icon = iconMap[module.icon];
              const isActive = pathname.startsWith(module.route);

              return (
                <li key={module.id}>
                  <Link
                    href={module.route}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isabel-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-isabel-deep-900",
                      isActive
                        ? "bg-isabel-indigo-600 text-white"
                        : "text-isabel-deep-100 hover:bg-isabel-deep-700 hover:text-white"
                    )}
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

        <div className="hidden items-center gap-1 md:flex">
          <ThemeToggle />
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-white transition-colors hover:bg-isabel-deep-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isabel-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-isabel-deep-900 md:hidden"
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
          className="border-t border-isabel-deep-700/30 bg-isabel-deep-800 md:hidden"
          aria-label="Navegación móvil de módulos"
        >
          <ul className="flex flex-col gap-1 p-4" role="list">
            {enabledModules.map((module) => {
              const Icon = iconMap[module.icon];
              const isActive = pathname.startsWith(module.route);

              return (
                <li key={module.id}>
                  <Link
                    href={module.route}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isabel-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-isabel-deep-800",
                      isActive
                        ? "bg-isabel-indigo-600 text-white"
                        : "text-isabel-deep-100 hover:bg-isabel-deep-700 hover:text-white"
                    )}
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
