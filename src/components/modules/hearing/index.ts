import type { ModuleInterface } from "@/types/module";

export const hearingModule: ModuleInterface = {
  id: "hearing",
  name: "Audición",
  description: "Asistencia para personas con discapacidad auditiva. Incluye avatar LSM.",
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
