import type { Metadata } from "next";

import { MobilityInterface } from "@/components/modules/mobility";
import { mobilityModule } from "@/lib/module-registry";

export const metadata: Metadata = {
  title: mobilityModule.name,
  description: mobilityModule.description,
};

export default function MobilityModulePage() {
  return <MobilityInterface module={mobilityModule} />;
}
