import type { ReactNode } from "react";

import {
  AccessibilityProvider,
  ColorBlindFilters,
  FloatingAccessibilityDock,
  ImmersiveReaderBanner,
  ImmersiveReaderLayer,
} from "@/components/accessibility";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AccessibilityProvider>
        <ColorBlindFilters />
        {children}
        <ImmersiveReaderBanner />
        <ImmersiveReaderLayer />
        <FloatingAccessibilityDock />
      </AccessibilityProvider>
    </ToastProvider>
  );
}
