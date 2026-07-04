import type { ModuleInterface } from "@/types/module";

export const visualModule: ModuleInterface = {
  id: "visual",
  name: "Visual",
  description: "Asistencia para personas con discapacidad visual",
  status: "idle",
  route: "/modulos/visual",
  enabled: true,
  icon: "Eye",
  version: "0.1.0",
  capabilities: {
    requiresPermissions: false,
    services: ["supabase", "openai", "n8n"],
    keyboardNavigable: true,
  },
};

export { VisualInterface } from "./VisualInterface";
