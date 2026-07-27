// Client-side resume text extraction for PDF and DOCX.
// PDF via pdfjs-dist, DOCX via mammoth. Both bundle in the browser.

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractPdf(file);
  if (name.endsWith(".docx")) return extractDocx(file);
  throw new Error("Unsupported file type. Upload a PDF or DOCX.");
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Use a bundled worker URL so it works in production too.
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Preserve line breaks so the LLM can see resume structure (sections, bullets).
    let pageText = "";
    let lastY: number | null = null;
    for (const raw of content.items) {
      const it = raw as { str?: string; hasEOL?: boolean; transform?: number[] };
      const s = it.str ?? "";
      const y = it.transform?.[5] ?? null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        pageText += "\n";
      } else if (pageText && !pageText.endsWith(" ") && !pageText.endsWith("\n")) {
        pageText += " ";
      }
      pageText += s;
      if (it.hasEOL) pageText += "\n";
      lastY = y;
    }
    parts.push(pageText);
  }
  return normalize(parts.join("\n\n"));
}

async function extractDocx(file: File): Promise<string> {
  // @ts-expect-error - browser build has no types
  const mammoth = (await import("mammoth/mammoth.browser")) as {
    extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  };
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return normalize(result.value ?? "");
}

function normalize(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}