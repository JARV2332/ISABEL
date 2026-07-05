import type { A11yLocale } from "@/lib/accessibility/i18n";

let currentUtterance: SpeechSynthesisUtterance | null = null;
let resolveSpeak: (() => void) | null = null;

function speechLang(locale: A11yLocale): string {
  return locale === "en" ? "en-US" : "es-ES";
}

export function stopA11ySpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
  resolveSpeak = null;
}

export function isA11ySpeaking(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }
  return window.speechSynthesis.speaking;
}

export function speakA11y(text: string, locale: A11yLocale): Promise<void> {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return Promise.resolve();

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve();
  }

  stopA11ySpeech();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = speechLang(locale);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    currentUtterance = utterance;
    resolveSpeak = resolve;

    utterance.onend = () => {
      currentUtterance = null;
      resolveSpeak = null;
      resolve();
    };
    utterance.onerror = () => {
      currentUtterance = null;
      resolveSpeak = null;
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

const READABLE =
  "h1,h2,h3,h4,p,li,button,a,[role=button],[role=link],[role=heading],label,figcaption,blockquote,td,th";

export function getReadableElements(root: ParentNode = document): HTMLElement[] {
  if (typeof document === "undefined") return [];
  const container =
    root instanceof Document ? root.querySelector("main") ?? root.body : root;

  if (!container) return [];

  return Array.from(container.querySelectorAll<HTMLElement>(READABLE)).filter(
    (el) => {
      if (el.closest("[data-a11y-ignore]")) return false;
      const text = getElementSpeechText(el);
      return text.length > 0;
    }
  );
}

export function getElementSpeechText(el: HTMLElement): string {
  const aria = el.getAttribute("aria-label")?.trim();
  if (aria) return aria;

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const parts = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean);
    if (parts.length) return parts.join(". ");
  }

  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function findReadableTarget(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  const match = node.closest(READABLE);
  return match instanceof HTMLElement ? match : null;
}

export async function readPageSequentially(
  locale: A11yLocale,
  onHighlight?: (el: HTMLElement | null) => void
): Promise<void> {
  const blocks = getReadableElements();
  for (const el of blocks) {
    onHighlight?.(el);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    await speakA11y(getElementSpeechText(el), locale);
  }
  onHighlight?.(null);
}
