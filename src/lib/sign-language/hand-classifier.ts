/**
 * Dactilología LSM/ASL — clasificación robusta desde landmarks MediaPipe.
 * Usa distancias normalizadas al tamaño de la palma (invariante a rotación/zoom).
 */

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface LetterResult {
  letter: string | null;
  confidence: number;
  /** Estados para depuración en UI */
  fingers: [boolean, boolean, boolean, boolean, boolean];
}

const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_IP = 3;
const THUMB_MCP = 2;
const INDEX_TIP = 8;
const INDEX_PIP = 6;
const INDEX_MCP = 5;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const MIDDLE_MCP = 9;
const RING_TIP = 16;
const RING_PIP = 14;
const RING_MCP = 13;
const PINKY_TIP = 20;
const PINKY_PIP = 18;
const PINKY_MCP = 17;

function dist(a: HandLandmark, b: HandLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 0.5);
}

function palmScale(lm: HandLandmark[]): number {
  const a = dist(lm[WRIST], lm[MIDDLE_MCP]);
  const b = dist(lm[INDEX_MCP], lm[PINKY_MCP]);
  return Math.max(a, b, 0.08);
}

function palmCenter(lm: HandLandmark[]): HandLandmark {
  return {
    x: (lm[INDEX_MCP].x + lm[MIDDLE_MCP].x + lm[RING_MCP].x + lm[PINKY_MCP].x) / 4,
    y: (lm[INDEX_MCP].y + lm[MIDDLE_MCP].y + lm[RING_MCP].y + lm[PINKY_MCP].y) / 4,
    z: 0,
  };
}

/** Dedo extendido: punta más lejos del centro de palma que la articulación PIP. */
function isExtended(
  lm: HandLandmark[],
  tip: number,
  pip: number,
  mcp: number,
  scale: number,
  center: HandLandmark
): boolean {
  const tipD = dist(lm[tip], center);
  const pipD = dist(lm[pip], center);
  const mcpD = dist(lm[mcp], center);
  return tipD > pipD + scale * 0.12 && tipD > mcpD + scale * 0.05;
}

/** Dedo claramente plegado. */
function isFolded(
  lm: HandLandmark[],
  tip: number,
  pip: number,
  scale: number,
  center: HandLandmark
): boolean {
  return dist(lm[tip], center) < dist(lm[pip], center) + scale * 0.04;
}

function analyzeHand(lm: HandLandmark[], handedness?: string | null) {
  const scale = palmScale(lm);
  const center = palmCenter(lm);

  const index = isExtended(lm, INDEX_TIP, INDEX_PIP, INDEX_MCP, scale, center);
  const middle = isExtended(lm, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP, scale, center);
  const ring = isExtended(lm, RING_TIP, RING_PIP, RING_MCP, scale, center);
  const pinky = isExtended(lm, PINKY_TIP, PINKY_PIP, PINKY_MCP, scale, center);

  const thumbToIndex = dist(lm[THUMB_TIP], lm[INDEX_TIP]);
  const thumbToMiddle = dist(lm[THUMB_TIP], lm[MIDDLE_TIP]);
  const thumbToPalm = dist(lm[THUMB_TIP], center);
  const thumbIpToPalm = dist(lm[THUMB_IP], center);

  const thumbExtended =
    thumbToPalm > thumbIpToPalm + scale * 0.08 &&
    dist(lm[THUMB_TIP], lm[INDEX_MCP]) > scale * 0.45;

  const thumbTucked =
    !thumbExtended &&
    thumbToPalm < scale * 0.55 &&
    dist(lm[THUMB_TIP], lm[INDEX_MCP]) < scale * 0.65;

  const indexMiddleSpread = dist(lm[INDEX_TIP], lm[MIDDLE_TIP]) / scale;
  const indexMiddleTogether = indexMiddleSpread < 0.28;
  const indexMiddleSpreadApart = indexMiddleSpread > 0.38;

  const thumbIndexTouch = thumbToIndex < scale * 0.35;
  const thumbMiddleTouch = thumbToMiddle < scale * 0.38;

  const oCircle =
    thumbIndexTouch &&
    isFolded(lm, MIDDLE_TIP, MIDDLE_PIP, scale, center) &&
    isFolded(lm, RING_TIP, RING_PIP, scale, center) &&
    isFolded(lm, PINKY_TIP, PINKY_PIP, scale, center);

  const fist =
    !index &&
    !middle &&
    !ring &&
    !pinky &&
    isFolded(lm, INDEX_TIP, INDEX_PIP, scale, center) &&
    isFolded(lm, MIDDLE_TIP, MIDDLE_PIP, scale, center);

  const fourUp = index && middle && ring && pinky;

  const indexAngle =
    Math.abs(lm[INDEX_TIP].x - lm[THUMB_TIP].x) +
    Math.abs(lm[INDEX_TIP].y - lm[THUMB_TIP].y);

  const isRight = handedness?.toLowerCase().includes("right");

  const fingers: [boolean, boolean, boolean, boolean, boolean] = [
    thumbExtended,
    index,
    middle,
    ring,
    pinky,
  ];

  return {
    scale,
    fingers,
    index,
    middle,
    ring,
    pinky,
    thumbExtended,
    thumbTucked,
    thumbIndexTouch,
    thumbMiddleTouch,
    indexMiddleSpread,
    indexMiddleTogether,
    indexMiddleSpreadApart,
    oCircle,
    fist,
    fourUp,
    indexAngle: indexAngle / scale,
    isRight,
    indexFolded: isFolded(lm, INDEX_TIP, INDEX_PIP, scale, center),
    middleFolded: isFolded(lm, MIDDLE_TIP, MIDDLE_PIP, scale, center),
    ringFolded: isFolded(lm, RING_TIP, RING_PIP, scale, center),
    pinkyFolded: isFolded(lm, PINKY_TIP, PINKY_PIP, scale, center),
  };
}

type HandAnalysis = ReturnType<typeof analyzeHand>;

function scoreLetter(letter: string, s: HandAnalysis): number {
  const ext = [s.index, s.middle, s.ring, s.pinky].filter(Boolean).length;

  switch (letter) {
    case "A":
      if (s.fist && !s.thumbExtended) return 95;
      if (s.fist && s.thumbTucked) return 88;
      return 0;

    case "B":
      if (s.fourUp && !s.thumbExtended && s.thumbTucked) return 98;
      if (s.fourUp && !s.thumbExtended) return 85;
      return 0;

    case "C": {
      if (
        !s.fourUp &&
        !s.fist &&
        !s.thumbIndexTouch &&
        s.indexMiddleSpread > 0.22 &&
        s.indexMiddleSpread < 0.55 &&
        (s.index || s.middle)
      )
        return 78;
      return 0;
    }

    case "D":
      if (s.index && !s.middle && !s.ring && !s.pinky && s.thumbTucked) return 96;
      if (s.index && ext === 1 && !s.thumbExtended) return 88;
      return 0;

    case "E":
      if (s.fist && s.thumbTucked && s.thumbIndexTouch) return 90;
      if (!s.index && !s.middle && !s.ring && !s.pinky && s.thumbTucked) return 82;
      return 0;

    case "F":
      if (s.thumbIndexTouch && s.middle && s.ring && s.pinky && !s.index) return 92;
      if (s.thumbIndexTouch && s.middle && s.ring) return 78;
      return 0;

    case "G":
      if (s.index && !s.middle && !s.ring && !s.pinky && s.thumbExtended) return 70;
      return 0;

    case "H":
      if (s.index && s.middle && s.indexMiddleTogether && !s.ring && !s.pinky)
        return s.thumbExtended ? 72 : 80;
      return 0;

    case "I":
      if (s.pinky && ext === 1 && !s.thumbExtended) return 96;
      if (s.pinky && !s.index && !s.middle && !s.ring) return 88;
      return 0;

    case "K":
      if (
        s.index &&
        s.middle &&
        s.thumbExtended &&
        s.indexMiddleSpreadApart &&
        !s.ring &&
        !s.pinky
      )
        return 85;
      return 0;

    case "L":
      if (
        s.index &&
        s.thumbExtended &&
        !s.middle &&
        !s.ring &&
        !s.pinky &&
        s.indexAngle > 0.55
      )
        return 96;
      if (s.index && s.thumbExtended && ext === 1) return 82;
      return 0;

    case "M":
      if (s.index && s.middle && s.ring && !s.pinky && s.thumbTucked && !s.thumbExtended)
        return 88;
      return 0;

    case "N":
      if (s.index && s.middle && !s.ring && !s.pinky && s.thumbTucked) return 88;
      return 0;

    case "O":
      if (s.oCircle) return 98;
      if (s.thumbIndexTouch && s.indexFolded) return 85;
      return 0;

    case "P":
      if (s.index && s.middle && s.thumbExtended && s.indexMiddleTogether) return 70;
      return 0;

    case "Q":
      if (s.index && s.thumbExtended && !s.middle) return 68;
      return 0;

    case "R":
      if (s.index && s.middle && s.indexMiddleTogether && !s.ring && !s.pinky)
        return 65;
      return 0;

    case "S":
      if (s.fist && s.thumbTucked && s.thumbIndexTouch) return 94;
      if (s.fist && !s.thumbExtended && thumbOverFingers(s)) return 90;
      return 0;

    case "T":
      if (s.fist && s.thumbMiddleTouch && !s.index) return 88;
      return 0;

    case "U":
      if (s.index && s.middle && s.indexMiddleTogether && !s.ring && !s.pinky)
        return s.thumbTucked || !s.thumbExtended ? 96 : 78;
      return 0;

    case "V":
      if (s.index && s.middle && s.indexMiddleSpreadApart && !s.ring && !s.pinky)
        return s.thumbTucked || !s.thumbExtended ? 96 : 80;
      return 0;

    case "W":
      if (s.index && s.middle && s.ring && !s.pinky && !s.thumbExtended) return 94;
      return 0;

    case "X":
      if (s.indexFolded && !s.middle && !s.ring && !s.pinky && !s.thumbExtended)
        return 82;
      return 0;

    case "Y":
      if (s.thumbExtended && s.pinky && !s.index && !s.middle && !s.ring) return 97;
      if (s.thumbExtended && s.pinky && ext === 1) return 88;
      return 0;

    default:
      return 0;
  }
}

function thumbOverFingers(s: HandAnalysis): boolean {
  return s.thumbTucked || s.thumbIndexTouch;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXY".split("");
const MIN_CONFIDENCE = 68;

export function classifyDactilologyLetter(
  landmarks: HandLandmark[],
  handedness?: string | null
): LetterResult {
  if (landmarks.length < 21) {
    return { letter: null, confidence: 0, fingers: [false, false, false, false, false] };
  }

  const analysis = analyzeHand(landmarks, handedness);

  let bestLetter: string | null = null;
  let bestScore = 0;

  for (const letter of ALPHABET) {
    const score = scoreLetter(letter, analysis);
    if (score > bestScore) {
      bestScore = score;
      bestLetter = letter;
    }
  }

  if (bestScore < MIN_CONFIDENCE) {
    return {
      letter: null,
      confidence: bestScore,
      fingers: analysis.fingers,
    };
  }

  return {
    letter: bestLetter,
    confidence: bestScore,
    fingers: analysis.fingers,
  };
}

/** Dibuja esqueleto + letra detectada sobre el canvas. */
export function drawHandOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number,
  result: LetterResult
) {
  const toPx = (lm: HandLandmark) => ({
    x: lm.x * width,
    y: lm.y * height,
  });

  const connections: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17],
  ];

  const fingerColors = [
    result.fingers[0] ? "#67e8f9" : "#64748b",
    result.fingers[1] ? "#22d3ee" : "#64748b",
    result.fingers[2] ? "#22d3ee" : "#64748b",
    result.fingers[3] ? "#22d3ee" : "#64748b",
    result.fingers[4] ? "#22d3ee" : "#64748b",
  ];

  ctx.strokeStyle = "rgba(34, 211, 238, 0.7)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  for (const [a, b] of connections) {
    const p1 = toPx(landmarks[a]);
    const p2 = toPx(landmarks[b]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  const tipIndices = [4, 8, 12, 16, 20];
  tipIndices.forEach((idx, i) => {
    const p = toPx(landmarks[idx]);
    ctx.fillStyle = fingerColors[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  for (const idx of [0, 5, 9, 13, 17]) {
    const p = toPx(landmarks[idx]);
    ctx.fillStyle = "#a5f3fc";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const label = result.letter ?? "…";
  const boxW = 120;
  const boxH = 110;

  ctx.fillStyle = result.letter
    ? "rgba(8, 145, 178, 0.92)"
    : "rgba(11, 31, 58, 0.75)";
  ctx.fillRect(width / 2 - boxW / 2, 12, boxW, boxH);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, width / 2, 52);

  if (result.letter) {
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.fillText(`${result.confidence}%`, width / 2, 98);
  } else if (result.confidence > 0) {
    ctx.font = "500 13px system-ui, sans-serif";
    ctx.fillText(`Ajusta la pose (${result.confidence}%)`, width / 2, 98);
  }
}
