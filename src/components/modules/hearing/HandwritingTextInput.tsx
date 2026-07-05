"use client";

import { HandwritingBoard } from "@/components/shared/HandwritingBoard";
import { cn } from "@/lib/utils";

interface HandwritingTextInputProps {
  onTextRecognized: (text: string) => void;
  phraseContext?: string;
  disabled?: boolean;
  className?: string;
}

export function HandwritingTextInput({
  onTextRecognized,
  phraseContext = "",
  disabled = false,
  className,
}: HandwritingTextInputProps) {
  return (
    <HandwritingBoard
      moduleId="hearing"
      className={cn(className)}
      context={phraseContext}
      disabled={disabled}
      confirmLabel="Agregar texto"
      readLabel="Leer trazo"
      onConfirm={onTextRecognized}
    />
  );
}
