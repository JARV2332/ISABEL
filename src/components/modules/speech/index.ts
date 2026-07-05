import type { ModuleInterface } from "@/types/module";

export const speechModule: ModuleInterface = {
  id: "speech",
  name: "Habla",
  navLabel: "Asistencia del Habla",
  description: "Asistencia para personas con discapacidad del habla",
  status: "idle",
  route: "/modulos/habla",
  enabled: true,
  icon: "Mic",
  version: "0.1.0",
  capabilities: {
    requiresPermissions: true,
    services: ["supabase", "openai", "elevenlabs", "n8n"],
    keyboardNavigable: true,
  },
};

export { SpeechInterface } from "./SpeechInterface";
export { SmartBoard } from "./SmartBoard";
