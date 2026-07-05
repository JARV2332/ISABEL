import type { ModuleInterface } from "@/types/module";

export const hearingModule: ModuleInterface = {
  id: "hearing",
  name: "Asistencia para personas con discapacidad auditiva",
  navLabel: "Asistencia Auditiva",
  description:
    "Elige cómo deseas comunicarte. ISABEL adaptará la conversación automáticamente.",
  status: "idle",
  route: "/modulos/audicion",
  enabled: true,
  icon: "Ear",
  version: "0.1.0",
  capabilities: {
    requiresPermissions: true,
    services: ["supabase", "elevenlabs", "openai", "n8n"],
    keyboardNavigable: true,
  },
};

export { HearingInterface } from "./HearingInterface";
