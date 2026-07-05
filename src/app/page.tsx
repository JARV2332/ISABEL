import Image from "next/image";
import Link from "next/link";
import { Ear, Mic, Eye, Accessibility } from "lucide-react";

import { enabledModules } from "@/components/modules";
import { IotPanel } from "@/components/dashboard/IotPanel";
import { getModuleTheme } from "@/lib/module-themes";

const iconMap = {
  Ear,
  Mic,
  Eye,
  Accessibility,
} as const;

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section
        aria-labelledby="hero-heading"
        className="human-surface flex flex-col items-start gap-6 rounded-[2.5rem] border-2 border-white/80 p-8 sm:flex-row sm:items-center sm:p-10"
      >
        <Image
          src="/logo-icon.png"
          alt="Logo ISABEL — accesibilidad visual, auditiva, habla y movilidad"
          width={120}
          height={120}
          className="size-28 shrink-0 rounded-3xl shadow-xl"
          priority
        />
        <div className="space-y-3">
          <h1
            id="hero-heading"
            className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Bienvenido a ISABEL
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Estación inteligente de accesibilidad. Cuatro módulos,
            un mismo corazón conectado — elige por dónde empezar.
          </p>
        </div>
      </section>

      <section aria-labelledby="modules-heading">
        <h2
          id="modules-heading"
          className="mb-6 text-2xl font-extrabold text-foreground"
        >
          Módulos de accesibilidad
        </h2>
        <ul
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          role="list"
        >
          {enabledModules.map((module) => {
            const Icon = iconMap[module.icon as keyof typeof iconMap];
            const theme = getModuleTheme(module.id);

            return (
              <li key={module.id}>
                <Link
                  href={module.route}
                  className="group human-press flex h-full flex-col rounded-[2rem] border-2 bg-card p-6 shadow-lg transition-shadow hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2"
                  style={{
                    borderColor: `${theme.accentLight}80`,
                    boxShadow: `0 8px 30px -8px ${theme.accent}33`,
                  }}
                >
                  <div
                    className="mb-5 flex size-16 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:scale-105"
                    style={{ background: theme.gradient }}
                  >
                    {Icon && <Icon className="size-8" aria-hidden="true" />}
                  </div>
                  <h3 className="text-xl font-extrabold text-card-foreground">
                    {module.name}
                  </h3>
                  <p className="mt-2 flex-1 text-base leading-relaxed text-muted-foreground">
                    {module.description}
                  </p>
                  <span
                    className="mt-5 text-base font-bold"
                    style={{ color: theme.accent }}
                  >
                    Abrir módulo →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <IotPanel />
    </div>
  );
}
