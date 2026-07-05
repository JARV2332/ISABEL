const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function validatePdfFile(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return "Solo se aceptan archivos PDF.";
  }

  if (file.size > MAX_PDF_BYTES) {
    return "El PDF no puede superar 10 MB.";
  }

  if (file.size === 0) {
    return "El archivo PDF está vacío.";
  }

  return null;
}

/** Extrae texto legible de un PDF en el navegador (pdf.js). */
export async function extractTextFromPdf(file: File): Promise<string> {
  const validationError = validatePdfFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) pages.push(pageText);
  }

  const text = pages.join("\n\n").trim();
  if (!text) {
    throw new Error(
      "No se encontró texto legible en el PDF. Prueba con un documento que no sea solo imágenes."
    );
  }

  return text;
}
