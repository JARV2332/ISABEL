import type { Metadata } from "next";

import { HearingInterface } from "@/components/modules/hearing";
import { hearingModule } from "@/lib/module-registry";

export const metadata: Metadata = {
  title: hearingModule.name,
  description: hearingModule.description,
};

export default function HearingModulePage() {
  return <HearingInterface module={hearingModule} />;
}
