export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractPdf(file);
  if (name.endsWith(".docx")) return extractDocx(file);
  throw new Error("Unsupported file type. Upload a PDF or DOCX.");
}

async function extractPdf(file: File): Promise<string> {
  installPdfPolyfills();

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent({ includeMarkedContent: false });
    const items = content.items
      .map((raw) => {
        const item = raw as { str?: string; hasEOL?: boolean; transform?: number[]; width?: number };
        return {
          text: item.str ?? "",
          x: item.transform?.[4] ?? 0,
          y: item.transform?.[5] ?? 0,
          hasEOL: Boolean(item.hasEOL),
          width: item.width ?? 0,
        };
      })
      .filter((item) => item.text.trim().length > 0)
      .sort((a, b) => {
        const yDiff = b.y - a.y;
        return Math.abs(yDiff) > 2 ? yDiff : a.x - b.x;
      });

    const lines: string[] = [];
    let currentLine: Array<{ text: string; x: number; y: number; hasEOL: boolean; width: number }> = [];
    let currentY: number | null = null;
    for (const item of items) {
      const newLine = currentY === null || Math.abs(item.y - currentY) > 2.5;
      if (newLine && currentLine.length > 0) {
        lines.push(joinPdfLine(currentLine));
        currentLine = [];
      }
      currentLine.push(item);
      currentY = item.y;
      if (item.hasEOL) {
        lines.push(joinPdfLine(currentLine));
        currentLine = [];
        currentY = null;
      }
    }
    if (currentLine.length > 0) lines.push(joinPdfLine(currentLine));
    pages.push(lines.filter(Boolean).join("\n"));
  }
  const text = normalize(pages.join("\n\n"));
  if (text.length < 40) {
    throw new Error("This PDF does not contain readable text. Please upload a text-based PDF or DOCX resume.");
  }
  return text;
}

async function extractDocx(file: File): Promise<string> {
  // @ts-expect-error - browser build has no types
  const mammoth = (await import("mammoth/mammoth.browser")) as {
    extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  };
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  const text = normalize(result.value ?? "");
  if (text.length < 40) {
    throw new Error("This DOCX does not contain enough readable resume text.");
  }
  return text;
}

function installPdfPolyfills() {
  const proto = Uint8Array.prototype as Uint8Array & { toHex?: () => string };
  if (typeof proto.toHex === "function") return;
  Object.defineProperty(Uint8Array.prototype, "toHex", {
    value: function toHex(this: Uint8Array) {
      return Array.from(this, (byte) => byte.toString(16).padStart(2, "0")).join("");
    },
    configurable: true,
  });
}

function joinPdfLine(items: Array<{ text: string; x: number; width: number }>): string {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  let line = "";
  let previousRight: number | null = null;
  for (const item of sorted) {
    const gap = previousRight === null ? 0 : item.x - previousRight;
    const separator = line.length === 0 ? "" : gap > 10 ? "  " : " ";
    line += `${separator}${item.text}`;
    previousRight = item.x + item.width;
  }
  return line.trim();
}

function normalize(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\t]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}