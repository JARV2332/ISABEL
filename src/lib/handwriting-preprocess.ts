/**
 * Preprocesa trazos de pizarra para visión IA:
 * recorte al contenido, escala, binarización y engrosado de trazo.
 */

const INK_THRESHOLD = 225;
const MIN_OUTPUT = 512;
const CROP_PADDING = 28;

function isInk(lum: number): boolean {
  return lum < INK_THRESHOLD;
}

function dilateStrokes(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length);

  for (let i = 0; i < pixels.length; i += 4) {
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = 255;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let ink = pixels[idx] === 0;

      if (!ink) {
        for (let dy = -1; dy <= 1 && !ink; dy++) {
          for (let dx = -1; dx <= 1 && !ink; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
            const nIdx = (ny * width + nx) * 4;
            if (pixels[nIdx] === 0) ink = true;
          }
        }
      }

      if (ink) {
        out[idx] = 0;
        out[idx + 1] = 0;
        out[idx + 2] = 0;
      }
    }
  }

  return out;
}

function binarizeImageData(imageData: ImageData): void {
  const { data, width, height } = imageData;
  const pixels = data;

  for (let i = 0; i < pixels.length; i += 4) {
    const lum =
      0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];

    const ink = isInk(lum) ? 0 : 255;
    pixels[i] = ink;
    pixels[i + 1] = ink;
    pixels[i + 2] = ink;
    pixels[i + 3] = 255;
  }

  const thickened = dilateStrokes(pixels, width, height);
  pixels.set(thickened);
}

function findInkBounds(imageData: ImageData): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] === 0) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return null;

  return {
    minX: Math.max(0, minX - CROP_PADDING),
    minY: Math.max(0, minY - CROP_PADDING),
    maxX: Math.min(width - 1, maxX + CROP_PADDING),
    maxY: Math.min(height - 1, maxY + CROP_PADDING),
  };
}

function scaleToMinimum(
  source: HTMLCanvasElement,
  minSide: number
): HTMLCanvasElement {
  const scale = Math.max(minSide / source.width, minSide / source.height, 1);
  const out = document.createElement("canvas");
  out.width = Math.round(source.width * scale);
  out.height = Math.round(source.height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return source;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

export async function enhanceHandwritingImage(dataUrl: string): Promise<string> {
  if (typeof window === "undefined") {
    return dataUrl.includes(",") ? (dataUrl.split(",")[1] ?? dataUrl) : dataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const source = document.createElement("canvas");
      source.width = img.width;
      source.height = img.height;
      const sourceCtx = source.getContext("2d");
      if (!sourceCtx) {
        reject(new Error("Canvas no disponible"));
        return;
      }

      sourceCtx.fillStyle = "#ffffff";
      sourceCtx.fillRect(0, 0, source.width, source.height);
      sourceCtx.drawImage(img, 0, 0);

      const sourceImage = sourceCtx.getImageData(0, 0, source.width, source.height);
      binarizeImageData(sourceImage);
      sourceCtx.putImageData(sourceImage, 0, 0);

      const bounds = findInkBounds(sourceImage);
      let cropped = source;

      if (bounds) {
        const cropW = bounds.maxX - bounds.minX + 1;
        const cropH = bounds.maxY - bounds.minY + 1;
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext("2d");
        if (cropCtx) {
          cropCtx.fillStyle = "#ffffff";
          cropCtx.fillRect(0, 0, cropW, cropH);
          cropCtx.drawImage(
            source,
            bounds.minX,
            bounds.minY,
            cropW,
            cropH,
            0,
            0,
            cropW,
            cropH
          );
          cropped = cropCanvas;
        }
      }

      const scaled = scaleToMinimum(cropped, MIN_OUTPUT);
      const scaledCtx = scaled.getContext("2d");
      if (!scaledCtx) {
        reject(new Error("Canvas no disponible"));
        return;
      }

      const finalData = scaledCtx.getImageData(0, 0, scaled.width, scaled.height);
      binarizeImageData(finalData);
      scaledCtx.putImageData(finalData, 0, 0);

      const out = scaled.toDataURL("png");
      resolve(out.includes(",") ? (out.split(",")[1] ?? out) : out);
    };
    img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
    img.src = dataUrl.startsWith("data:")
      ? dataUrl
      : `data:image/png;base64,${dataUrl}`;
  });
}
