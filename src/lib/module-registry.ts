import type { ModuleInterface, ModuleRegistry } from "@/types/module";

import { hearingModule } from "@/components/modules/hearing";
import { mobilityModule } from "@/components/modules/mobility";
import { speechModule } from "@/components/modules/speech";
import { visualModule } from "@/components/modules/visual";

/** Registro central de módulos de accesibilidad */
export const moduleRegistry: ModuleRegistry = {
  hearing: hearingModule,
  speech: speechModule,
  visual: visualModule,
  mobility: mobilityModule,
};

/** Lista ordenada de módulos habilitados para navegación */
export const enabledModules: ModuleInterface[] = Object.values(
  moduleRegistry
).filter((module) => module.enabled);

export {
  hearingModule,
  speechModule,
  visualModule,
  mobilityModule,
};
