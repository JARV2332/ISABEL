import type { Metadata } from "next";

import { SpeechInterface } from "@/components/modules/speech";
import { speechModule } from "@/lib/module-registry";

export const metadata: Metadata = {
  title: speechModule.name,
  description: speechModule.description,
};

export default function SpeechModulePage() {
  return <SpeechInterface module={speechModule} />;
}
