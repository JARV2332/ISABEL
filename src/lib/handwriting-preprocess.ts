/**
 * Preprocesa trazos de pizarra para visión IA:
 * escala 2×, alto contraste blanco/negro — ayuda con caligrafía temblorosa.
 */
export async function enhanceHandwritingImage(dataUrl: string): Promise<string> {
  if (typeof window === "undefined") {
    return dataUrl.includes(",") ? (dataUrl.split(",")[1] ?? dataUrl) : dataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(img.width * scale, 640);
      canvas.height = Math.max(img.height * scale, 480);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas no disponible"));
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum < 210) {
          pixels[i] = 0;
          pixels[i + 1] = 0;
          pixels[i + 2] = 0;
        } else {
          pixels[i] = 255;
          pixels[i + 1] = 255;
          pixels[i + 2] = 255;
        }
        pixels[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);

      const out = canvas.toDataURL("png");
      resolve(out.includes(",") ? (out.split(",")[1] ?? out) : out);
    };
    img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
    img.src = dataUrl.startsWith("data:") ? dataUrl : `data:image/png;base64,${dataUrl}`;
  });
}
