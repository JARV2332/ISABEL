export interface SpaceSection {
  id: string;
  title: string;
  content: string;
}

export interface AccessibilitySpace {
  id: string;
  name: string;
  subtitle: string;
  /** Etiqueta corta para tarjetas */
  shortLabel: string;
  sections: SpaceSection[];
}
