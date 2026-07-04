/**
 * Generador de instrucciones BML para Performs (UPF).
 * Convierte glosas LSM en animaciones procedimentales del avatar 3D.
 *
 * Nota: Performs no incluye LSM nativo; estas animaciones son aproximaciones
 * visuales hasta que se creen entradas en Animics (https://animics.gti.upf.edu).
 */

export interface BmlBehaviour {
  type: string;
  start: number;
  [key: string]: unknown;
}

export interface BmlScript {
  behaviours: BmlBehaviour[];
}

const SIGN_DURATION = 1.45;
const SIGN_OVERLAP = 0.15;

export const FLUENT_SIGN_MS = Math.round(SIGN_DURATION * 1000);

function baseTiming(start: number, duration = SIGN_DURATION) {
  return {
    start,
    ready: start + 0.18,
    relax: start + duration - 0.25,
    end: start + duration - SIGN_OVERLAP,
  };
}

function faceHappy(start: number): BmlBehaviour {
  const t = baseTiming(start);
  return {
    type: "faceEmotion",
    ...t,
    attackPeak: start + 0.35,
    emotion: "HAPPY",
    amount: 0.75,
  };
}

function headNod(start: number): BmlBehaviour {
  const t = baseTiming(start);
  return {
    type: "head",
    start: t.start,
    ready: start + 0.15,
    stroke: start + 0.35,
    relax: start + 0.7,
    end: start + 1.0,
    amount: 0.8,
    lexeme: "NOD",
  };
}

function handToChest(start: number, hand: "RIGHT" | "LEFT" = "RIGHT"): BmlBehaviour {
  const t = baseTiming(start);
  return {
    type: "locationBodyArm",
    start: t.start,
    ready: start + 0.3,
    relax: t.relax,
    end: t.end,
    hand,
    locationBodyArm: "CHEST",
    side: hand === "RIGHT" ? "R" : "L",
    distance: 0.35,
    handshape: "FLAT",
    extfidir: "U",
    palmor: "L",
  };
}

function handWave(start: number): BmlBehaviour {
  const t = baseTiming(start);
  return {
    type: "locationBodyArm",
    start: t.start,
    ready: start + 0.25,
    relax: t.relax,
    end: t.end,
    hand: "RIGHT",
    locationBodyArm: "HEAD",
    side: "R",
    distance: 0.55,
    handshape: "FLAT",
    extfidir: "UL",
    palmor: "L",
  };
}

function handsUp(start: number): BmlBehaviour[] {
  const t = baseTiming(start);
  return [
    {
      type: "locationBodyArm",
      start: t.start,
      ready: start + 0.35,
      relax: t.relax,
      end: t.end,
      hand: "BOTH",
      locationBodyArm: "HEAD",
      side: "R",
      distance: 0.75,
      handshape: "FINGER_2",
      extfidir: "U",
      palmor: "U",
    },
    faceHappy(start),
  ];
}

function pointForward(start: number): BmlBehaviour {
  const t = baseTiming(start);
  return {
    type: "locationBodyArm",
    start: t.start,
    ready: start + 0.3,
    relax: t.relax,
    end: t.end,
    hand: "RIGHT",
    locationBodyArm: "CHEST",
    side: "R",
    distance: 0.7,
    handshape: "FINGER_1",
    extfidir: "L",
    palmor: "D",
  };
}

function shakeHead(start: number): BmlBehaviour {
  return {
    type: "head",
    start,
    ready: start + 0.15,
    stroke: start + 0.4,
    relax: start + 0.9,
    end: start + 1.2,
    amount: 0.9,
    repetition: 2,
    lexeme: "SHAKE",
  };
}

function speechMouth(start: number, label: string): BmlBehaviour {
  const simplified = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .slice(0, 24);

  return {
    type: "speech",
    start,
    text: simplified || "HOLA",
    sentT: 1.4,
  };
}

/** Mapa de glosas LSM → animaciones BML aproximadas */
const GLOSS_ANIMATIONS: Record<string, (start: number) => BmlBehaviour[]> = {
  HOLA: (start) => [faceHappy(start), handWave(start), headNod(start)],
  GRACIAS: (start) => [faceHappy(start), handToChest(start), headNod(start)],
  AYUDA: (start) => handsUp(start),
  AGUA: (start) => [handToChest(start), pointForward(start)],
  BANO: (start) => [pointForward(start), headNod(start)],
  COMER: (start) => [handToChest(start), faceHappy(start)],
  HAMBRE: (start) => [handToChest(start)],
  JUGAR: (start) => [faceHappy(start), handWave(start)],
  DESCANSO: (start) => [
    {
      type: "head",
      start,
      ready: start + 0.2,
      relax: start + 1.5,
      end: start + 2,
      amount: 0.4,
      lexeme: "TILT_FORWARD",
    },
  ],
  DOLOR: (start) => [handToChest(start), shakeHead(start)],
  FELIZ: (start) => [faceHappy(start), handWave(start)],
  TRISTE: (start) => [
    {
      type: "faceEmotion",
      start,
      attackPeak: start + 0.4,
      relax: start + 1.6,
      end: start + 2,
      emotion: "SAD",
      amount: 0.6,
    },
  ],
  SI: (start) => [headNod(start), faceHappy(start)],
  NO: (start) => [shakeHead(start)],
  QUIERO: (start) => [handToChest(start), pointForward(start)],
  NECESITO: (start) => handsUp(start),
  BIEN: (start) => [headNod(start), faceHappy(start)],
  MAL: (start) => [shakeHead(start)],
  COMO: (start) => [
    {
      type: "gaze",
      start,
      ready: start + 0.2,
      relax: start + 1.1,
      end: start + 1.35,
      influence: "HEAD",
      target: "FRONT",
      headOnly: false,
    },
    {
      type: "faceLexeme",
      start,
      attackPeak: start + 0.25,
      relax: start + 1.1,
      end: start + 1.35,
      amount: 0.6,
      lexeme: "RAISED",
    },
  ],
  ESTAS: (start) => [pointForward(start), headNod(start + 0.15)],
  TU: (start) => [pointForward(start), faceHappy(start)],
  ESCUELA: (start) => [pointForward(start), handWave(start)],
  CASA: (start) => [handToChest(start), headNod(start)],
};

function defaultAnimation(gloss: string, label: string, start: number): BmlBehaviour[] {
  return [faceHappy(start), handWave(start), speechMouth(start + 0.2, label || gloss)];
}

export function glossToBml(gloss: string, label: string, start = 0): BmlScript {
  const key = gloss.toUpperCase();
  const builder = GLOSS_ANIMATIONS[key];
  const behaviours = builder ? builder(start) : defaultAnimation(key, label, start);
  return { behaviours };
}

export function sequenceToBml(
  signs: Array<{ gloss: string; label: string }>
): BmlScript {
  const behaviours: BmlBehaviour[] = [];

  signs.forEach((sign, index) => {
    const start = index * (SIGN_DURATION - SIGN_OVERLAP);
    const script = glossToBml(sign.gloss, sign.label, start);
    behaviours.push(...script.behaviours);
  });

  return { behaviours };
}

/** Duración total estimada de una secuencia fluida (ms) */
export function getFluentSequenceDurationMs(signCount: number): number {
  if (signCount <= 0) return 0;
  return Math.round(
    signCount * (SIGN_DURATION - SIGN_OVERLAP) * 1000 + SIGN_OVERLAP * 1000
  );
}

export const PERFORMS_PLAYER_PATH = "/performs/player.html";
