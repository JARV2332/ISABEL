import Link from "next/link";
import { Ear, Mic, Eye, Accessibility } from "lucide-react";

import { enabledModules } from "@/components/modules";

const iconMap = {
  Ear,
  Mic,
  Eye,
  Accessibility,
} as const;

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="hero-heading" className="space-y-4">
        <h1
          id="hero-heading"
          className="text-3xl font-bold tracking-tight text-isabel-deep-900 sm:text-4xl"
        >
          Bienvenido a ISABEL
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Estación inteligente de accesibilidad para EDUKIDS. Selecciona un
          módulo para comenzar.
        </p>
      </section>

      <section aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="sr-only">
          Módulos de accesibilidad disponibles
        </h2>
        <ul
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          role="list"
        >
          {enabledModules.map((module) => {
            const Icon = iconMap[module.icon as keyof typeof iconMap];

            return (
              <li key={module.id}>
                <Link
                  href={module.route}
                  className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isabel-indigo-500 focus-visible:ring-offset-2"
                >
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-isabel-indigo-100 text-isabel-indigo-600 transition-colors group-hover:bg-isabel-indigo-600 group-hover:text-white">
                    {Icon && <Icon className="size-6" aria-hidden="true" />}
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {module.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">
                    {module.description}
                  </p>
                  <span className="mt-4 text-sm font-medium text-isabel-indigo-600 group-hover:text-isabel-indigo-700">
                    Abrir módulo →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
