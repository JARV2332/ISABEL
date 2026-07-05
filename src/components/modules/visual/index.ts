import type { ModuleInterface } from "@/types/module";

export const visualModule: ModuleInterface = {
  id: "visual",
  name: "Visual",
  description: "Orientación en espacios físicos, lectura de texto y PDF en voz alta",
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
