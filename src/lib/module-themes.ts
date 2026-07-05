import type { ModuleId } from "@/types/module";

/** Paleta EDUKIDS — cuadrantes del logo ISABEL */
export interface ModuleTheme {
  id: ModuleId;
  label: string;
  accent: string;
  accentLight: string;
  accentFg: string;
  gradient: string;
  glow: string;
  iconBg: string;
  border: string;
}

export const moduleThemes: Record<ModuleId, ModuleTheme> = {
  visual: {
    id: "visual",
    label: "Visual",
    accent: "#F97316",
    accentLight: "#FBBF24",
    accentFg: "#1c1917",
    gradient: "linear-gradient(135deg, #FBBF24 0%, #F97316 100%)",
    glow: "0 20px 50px -12px rgb(249 115 22 / 0.35)",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
    border: "border-orange-300/60",
  },
  hearing: {
    id: "hearing",
    label: "Audición",
    accent: "#0EA5E9",
    accentLight: "#22D3EE",
    accentFg: "#ffffff",
    gradient: "linear-gradient(135deg, #22D3EE 0%, #0EA5E9 100%)",
    glow: "0 20px 50px -12px rgb(14 165 233 / 0.35)",
    iconBg: "bg-gradient-to-br from-cyan-400 to-sky-500",
    border: "border-cyan-300/60",
  },
  speech: {
    id: "speech",
    label: "Habla",
    accent: "#DB2777",
    accentLight: "#EC4899",
    accentFg: "#ffffff",
    gradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
    glow: "0 20px 50px -12px rgb(219 39 119 / 0.35)",
    iconBg: "bg-gradient-to-br from-pink-500 to-rose-600",
    border: "border-pink-300/60",
  },
  mobility: {
    id: "mobility",
    label: "Movilidad",
    accent: "#10B981",
    accentLight: "#84CC16",
    accentFg: "#ffffff",
    gradient: "linear-gradient(135deg, #84CC16 0%, #10B981 100%)",
    glow: "0 20px 50px -12px rgb(16 185 129 / 0.35)",
    iconBg: "bg-gradient-to-br from-lime-400 to-emerald-500",
    border: "border-lime-300/60",
  },
};

export function getModuleTheme(moduleId: string): ModuleTheme {
  return moduleThemes[moduleId as ModuleId] ?? moduleThemes.hearing;
}
