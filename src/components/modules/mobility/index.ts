import type { ModuleInterface } from "@/types/module";

export const mobilityModule: ModuleInterface = {
  id: "mobility",
  name: "Movilidad",
  navLabel: "Asistencia Móvil",
  description: "Lugares accesibles cerca de ti (mundial), rutas, transporte y comunicación por pictogramas",
  status: "idle",
  route: "/modulos/movilidad",
  enabled: true,
  icon: "Accessibility",
  version: "0.1.0",
  capabilities: {
    requiresPermissions: false,
    services: ["supabase", "n8n"],
    keyboardNavigable: true,
  },
};

export { MobilityInterface } from "./MobilityInterface";
