import type { Metadata } from "next";
import { Suspense } from "react";

import { VisualInterface } from "@/components/modules/visual";
import { visualModule } from "@/lib/module-registry";

export const metadata: Metadata = {
  title: visualModule.name,
  description: visualModule.description,
};

export default function VisualModulePage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando módulo Visual…</p>}>
      <VisualInterface module={visualModule} />
    </Suspense>
  );
}
