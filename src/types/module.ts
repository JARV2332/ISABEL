/**
 * Tipos base para los módulos de accesibilidad de ISABEL.
 * Cada módulo (hearing, speech, visual, mobility) debe implementar ModuleInterface.
 */

export type ModuleId = "hearing" | "speech" | "visual" | "mobility";

export type ModuleStatus =
  | "idle"
  | "active"
  | "processing"
  | "error"
  | "disabled";

export interface ModuleCapabilities {
  /** Indica si el módulo requiere permisos del navegador (micrófono, cámara, etc.) */
  requiresPermissions?: boolean;
  /** Servicios externos que consume este módulo */
  services?: Array<"supabase" | "elevenlabs" | "openai" | "n8n">;
  /** Indica soporte para navegación exclusiva por teclado */
  keyboardNavigable?: boolean;
}

export interface ModuleInterface {
  /** Identificador único del módulo */
  id: ModuleId;
  /** Nombre visible para el usuario */
  name: string;
  /** Descripción breve de la funcionalidad */
  description: string;
  /** Estado operativo actual */
  status: ModuleStatus;
  /** Ruta de navegación del módulo */
  route: string;
  /** Indica si el módulo está habilitado en la estación */
  enabled: boolean;
  /** Nombre del icono Lucide asociado */
  icon: string;
  /** Versión semántica del módulo */
  version: string;
  /** Capacidades y dependencias del módulo */
  capabilities?: ModuleCapabilities;
  /** Metadatos extensibles para configuración futura */
  metadata?: Record<string, unknown>;
}

export type ModuleRegistry = Record<ModuleId, ModuleInterface>;

/** Props compartidas por los componentes de interfaz de cada módulo */
export interface ModuleViewProps {
  module: ModuleInterface;
}
