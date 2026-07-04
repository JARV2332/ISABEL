import type { Metadata } from "next";

import { VisualInterface } from "@/components/modules/visual";
import { visualModule } from "@/lib/module-registry";

export const metadata: Metadata = {
  title: visualModule.name,
  description: visualModule.description,
};

export default function VisualModulePage() {
  return <VisualInterface module={visualModule} />;
}
