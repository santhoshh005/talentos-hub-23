import { jsPDF } from "jspdf";
import type { ParsedResumeData, ResumeAnalysis } from "./resume-analyzer.functions";

// TalentOS palette
const COLOR = {
  primary: "#2563EB",
  accent: "#38BDF8",
  ink: "#0F172A",
  sub: "#475569",
  muted: "#94A3B8",
  line: "#E2E8F0",
  bgSoft: "#F1F5F9",
  good: "#16A34A",
  warn: "#D97706",
  bad: "#DC2626",
  white: "#FFFFFF",
};

const PAGE = { w: 210, h: 297, margin: 15 }; // A4 mm
const CONTENT_W = PAGE.w - PAGE.margin * 2;

function scoreColor(v: number) {
  if (v >= 75) return COLOR.good;
  if (v >= 55) return COLOR.warn;
  return COLOR.bad;
}

/* ---------------- Canvas chart helpers ---------------- */

function makeCanvas(w: number, h: number) {
  const scale = 2;
  const c = document.createElement("canvas");
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.textBaseline = "middle";
  return { canvas: c, ctx };
}

function drawDonut(score: number, label: string) {
  const size = 260;
  const { canvas, ctx } = makeCanvas(size, size);
  ctx.fillStyle = COLOR.white;
  ctx.fillRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;
  const lw = 22;
  // track
  ctx.beginPath();
  ctx.strokeStyle = COLOR.bgSoft;
  ctx.lineWidth = lw;
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // arc
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, COLOR.primary);
  grad.addColorStop(1, COLOR.accent);
  ctx.beginPath();
  ctx.strokeStyle = grad;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx.stroke();
  // score text
  ctx.fillStyle = COLOR.ink;
  ctx.font = "700 54px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(score)}%`, cx, cy - 4);
  ctx.fillStyle = COLOR.sub;
  ctx.font = "500 16px Helvetica, Arial, sans-serif";
  ctx.fillText(label, cx, cy + 30);
  return canvas.toDataURL("image/png");
}

function drawHBars(items: { label: string; value: number }[], width = 520, rowH = 34) {
  const height = items.length * rowH + 20;
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.fillStyle = COLOR.white;
  ctx.fillRect(0, 0, width, height);
  const labelW = 150;
  const barX = labelW + 8;
  const barW = width - barX - 50;
  items.forEach((it, i) => {
    const y = 14 + i * rowH;
    ctx.fillStyle = COLOR.ink;
    ctx.font = "500 13px Helvetica, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(it.label, 4, y + 10);
    // track
    ctx.fillStyle = COLOR.bgSoft;
    ctx.fillRect(barX, y + 3, barW, 16);
    // fill
    const pct = Math.max(0, Math.min(100, it.value)) / 100;
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, COLOR.primary);
    grad.addColorStop(1, COLOR.accent);
    ctx.fillStyle = grad;
    ctx.fillRect(barX, y + 3, barW * pct, 16);
    ctx.fillStyle = COLOR.sub;
    ctx.font = "600 12px Helvetica, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${Math.round(it.value)}`, barX + barW + 6, y + 10);
  });
  return { data: canvas.toDataURL("image/png"), w: width, h: height };
}

function drawSkillsBar(matching: number, additional: number, missing: number) {
  const width = 520;
  const height = 140;
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.fillStyle = COLOR.white;
  ctx.fillRect(0, 0, width, height);
  const items = [
    { label: "Matching", value: matching, color: COLOR.good },
    { label: "Additional", value: additional, color: COLOR.accent },
    { label: "Missing", value: missing, color: COLOR.bad },
  ];
  const max = Math.max(1, ...items.map((i) => i.value));
  const barW = 90;
  const gap = 50;
  const totalW = items.length * barW + (items.length - 1) * gap;
  const startX = (width - totalW) / 2;
  const baseY = height - 30;
  items.forEach((it, i) => {
    const x = startX + i * (barW + gap);
    const h = (it.value / max) * 80;
    ctx.fillStyle = it.color;
    ctx.fillRect(x, baseY - h, barW, h);
    ctx.fillStyle = COLOR.ink;
    ctx.font = "700 14px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(it.value), x + barW / 2, baseY - h - 12);
    ctx.fillStyle = COLOR.sub;
    ctx.font = "500 12px Helvetica, Arial, sans-serif";
    ctx.fillText(it.label, x + barW / 2, baseY + 14);
  });
  return { data: canvas.toDataURL("image/png"), w: width, h: height };
}

/* ---------------- PDF layout helpers ---------------- */

type Ctx = { pdf: jsPDF; y: number };

function ensureSpace(c: Ctx, needed: number) {
  if (c.y + needed > PAGE.h - 20) {
    c.pdf.addPage();
    c.y = PAGE.margin;
  }
}

function setColor(pdf: jsPDF, hex: string, kind: "fill" | "text" | "draw" = "text") {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (kind === "fill") pdf.setFillColor(r, g, b);
  else if (kind === "draw") pdf.setDrawColor(r, g, b);
  else pdf.setTextColor(r, g, b);
}

function sectionHeader(c: Ctx, title: string) {
  ensureSpace(c, 14);
  setColor(c.pdf, COLOR.primary, "fill");
  c.pdf.rect(PAGE.margin, c.y, 3, 6, "F");
  setColor(c.pdf, COLOR.ink);
  c.pdf.setFont("helvetica", "bold");
  c.pdf.setFontSize(13);
  c.pdf.text(title, PAGE.margin + 6, c.y + 5);
  c.y += 10;
}

function paragraph(c: Ctx, text: string, size = 10, color = COLOR.sub) {
  if (!text) return;
  c.pdf.setFont("helvetica", "normal");
  c.pdf.setFontSize(size);
  setColor(c.pdf, color);
  const lines = c.pdf.splitTextToSize(text, CONTENT_W) as string[];
  const h = lines.length * (size * 0.42) + 2;
  ensureSpace(c, h);
  c.pdf.text(lines, PAGE.margin, c.y + size * 0.4);
  c.y += h;
}

function bullets(c: Ctx, items: string[]) {
  if (!items || items.length === 0) {
    paragraph(c, "—", 10, COLOR.muted);
    return;
  }
  c.pdf.setFont("helvetica", "normal");
  c.pdf.setFontSize(10);
  for (const item of items) {
    if (!item) continue;
    const lines = c.pdf.splitTextToSize(item, CONTENT_W - 6) as string[];
    const h = lines.length * 4.2 + 1.5;
    ensureSpace(c, h);
    setColor(c.pdf, COLOR.primary);
    c.pdf.text("•", PAGE.margin, c.y + 4);
    setColor(c.pdf, COLOR.sub);
    c.pdf.text(lines, PAGE.margin + 4, c.y + 4);
    c.y += h;
  }
}

function keyValueGrid(c: Ctx, entries: [string, string][]) {
  const colW = CONTENT_W / 2;
  const rowH = 12;
  for (let i = 0; i < entries.length; i += 2) {
    ensureSpace(c, rowH);
    const pair = [entries[i], entries[i + 1]].filter(Boolean) as [string, string][];
    pair.forEach(([k, v], idx) => {
      const x = PAGE.margin + idx * colW;
      setColor(c.pdf, COLOR.bgSoft, "fill");
      c.pdf.roundedRect(x, c.y, colW - 4, rowH - 2, 1.5, 1.5, "F");
      setColor(c.pdf, COLOR.muted);
      c.pdf.setFont("helvetica", "bold");
      c.pdf.setFontSize(8);
      c.pdf.text(k.toUpperCase(), x + 3, c.y + 4);
      setColor(c.pdf, COLOR.ink);
      c.pdf.setFont("helvetica", "normal");
      c.pdf.setFontSize(10);
      const val = v || "—";
      const lines = c.pdf.splitTextToSize(val, colW - 8) as string[];
      c.pdf.text(lines.slice(0, 1), x + 3, c.y + 8.5);
    });
    c.y += rowH;
  }
}

function chips(c: Ctx, items: string[], color: string) {
  if (!items || items.length === 0) {
    paragraph(c, "—", 10, COLOR.muted);
    return;
  }
  c.pdf.setFont("helvetica", "normal");
  c.pdf.setFontSize(9);
  let x = PAGE.margin;
  const gap = 3;
  const padX = 3;
  const chipH = 6.5;
  for (const raw of items) {
    const label = raw.length > 40 ? raw.slice(0, 39) + "…" : raw;
    const w = c.pdf.getTextWidth(label) + padX * 2;
    if (x + w > PAGE.margin + CONTENT_W) {
      x = PAGE.margin;
      c.y += chipH + 2;
    }
    ensureSpace(c, chipH + 2);
    setColor(c.pdf, color, "fill");
    c.pdf.roundedRect(x, c.y, w, chipH, 1.5, 1.5, "F");
    setColor(c.pdf, COLOR.white);
    c.pdf.text(label, x + padX, c.y + 4.4);
    x += w + gap;
  }
  c.y += chipH + 2;
}

function drawHeader(pdf: jsPDF, candidate: string) {
  setColor(pdf, COLOR.ink, "fill");
  pdf.rect(0, 0, PAGE.w, 22, "F");
  setColor(pdf, COLOR.accent, "fill");
  pdf.circle(PAGE.margin + 4, 11, 3, "F");
  setColor(pdf, COLOR.white);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("TalentOS", PAGE.margin + 10, 12);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(pdf, COLOR.muted);
  pdf.text("Resume Analyzer Report", PAGE.margin + 34, 12);
  pdf.setFontSize(9);
  setColor(pdf, COLOR.white);
  pdf.text(candidate, PAGE.w - PAGE.margin, 12, { align: "right" });
}

function drawFooters(pdf: jsPDF) {
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    setColor(pdf, COLOR.line, "draw");
    pdf.setLineWidth(0.2);
    pdf.line(PAGE.margin, PAGE.h - 12, PAGE.w - PAGE.margin, PAGE.h - 12);
    setColor(pdf, COLOR.muted);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Generated by TalentOS — AI Recruitment Platform", PAGE.margin, PAGE.h - 7);
    pdf.text(`Page ${i} of ${total}`, PAGE.w - PAGE.margin, PAGE.h - 7, { align: "right" });
  }
}

/* ---------------- Public API ---------------- */

export async function generateResumeReportPdf(
  parsed: ParsedResumeData,
  analysis: ResumeAnalysis | null,
): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const candidate = parsed.name || "Candidate";
  drawHeader(pdf, candidate);
  const c: Ctx = { pdf, y: 30 };

  // Cover: candidate + verdict + score
  setColor(pdf, COLOR.ink);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(candidate, PAGE.margin, c.y + 6);
  c.y += 10;
  setColor(pdf, COLOR.sub);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const meta = [parsed.experience, parsed.currentCompany, parsed.location].filter(Boolean).join("  •  ");
  if (meta) {
    pdf.text(meta, PAGE.margin, c.y + 4);
    c.y += 8;
  }
  pdf.text(`Generated ${new Date().toLocaleDateString()}`, PAGE.margin, c.y + 4);
  c.y += 10;

  if (analysis) {
    const donut = drawDonut(analysis.overallScore, "Overall Match");
    pdf.addImage(donut, "PNG", PAGE.margin, c.y, 55, 55);
    // verdict pill
    const vx = PAGE.margin + 62;
    const vy = c.y + 6;
    setColor(pdf, scoreColor(analysis.overallScore), "fill");
    pdf.roundedRect(vx, vy, 60, 8, 2, 2, "F");
    setColor(pdf, COLOR.white);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(analysis.verdict.toUpperCase(), vx + 30, vy + 5.5, { align: "center" });
    setColor(pdf, COLOR.sub);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const summary = pdf.splitTextToSize(analysis.summary, CONTENT_W - 62) as string[];
    pdf.text(summary, vx, vy + 15);
    c.y += 60;
  }

  // Candidate profile
  sectionHeader(c, "Candidate Profile");
  keyValueGrid(c, [
    ["Email", parsed.email],
    ["Phone", parsed.phone],
    ["Location", parsed.location],
    ["Experience", parsed.experience],
    ["Current company", parsed.currentCompany],
    ["Education", parsed.education],
  ]);
  c.y += 2;

  if (parsed.skills.length) {
    sectionHeader(c, "Skills");
    chips(c, parsed.skills.slice(0, 40), COLOR.primary);
  }
  if (parsed.technologies.length) {
    sectionHeader(c, "Technologies");
    chips(c, parsed.technologies.slice(0, 40), COLOR.accent);
  }
  if (parsed.projects.length) {
    sectionHeader(c, "Projects");
    bullets(c, parsed.projects.slice(0, 12));
  }
  if (parsed.certifications.length) {
    sectionHeader(c, "Certifications");
    bullets(c, parsed.certifications.slice(0, 12));
  }

  if (analysis) {
    // Category scores chart
    c.pdf.addPage();
    drawHeader(pdf, candidate);
    c.y = 30;
    sectionHeader(c, "Match Overview");
    const bars = drawHBars([
      { label: "Technical Skills", value: analysis.scores.technicalSkills },
      { label: "Experience", value: analysis.scores.experience },
      { label: "Education", value: analysis.scores.education },
      { label: "Communication", value: analysis.scores.communication },
      { label: "Culture Fit", value: analysis.scores.cultureFit },
    ]);
    const bw = CONTENT_W;
    const bh = (bars.h / bars.w) * bw;
    ensureSpace(c, bh + 4);
    pdf.addImage(bars.data, "PNG", PAGE.margin, c.y, bw, bh);
    c.y += bh + 4;

    // Skills breakdown
    sectionHeader(c, "Skills Breakdown");
    const sk = drawSkillsBar(analysis.matchingSkills.length, analysis.additionalSkills.length, analysis.missingSkills.length);
    const skH = (sk.h / sk.w) * bw;
    ensureSpace(c, skH + 4);
    pdf.addImage(sk.data, "PNG", PAGE.margin, c.y, bw, skH);
    c.y += skH + 4;

    sectionHeader(c, "Matching Skills");
    chips(c, analysis.matchingSkills, COLOR.good);
    sectionHeader(c, "Additional Skills");
    chips(c, analysis.additionalSkills, COLOR.accent);
    sectionHeader(c, "Missing Skills");
    chips(c, analysis.missingSkills, COLOR.bad);

    // Insights
    sectionHeader(c, "Summary");
    paragraph(c, analysis.summary);
    sectionHeader(c, "Strengths");
    bullets(c, analysis.strengths);
    sectionHeader(c, "Weaknesses");
    bullets(c, analysis.weaknesses);
    sectionHeader(c, "Resume Improvements");
    bullets(c, analysis.resumeImprovements);
    sectionHeader(c, "Hiring Recommendation");
    paragraph(c, analysis.hiringRecommendation);

    // Interview questions
    sectionHeader(c, "Interview Questions — Technical");
    bullets(c, analysis.interviewQuestions.technical);
    sectionHeader(c, "Interview Questions — HR");
    bullets(c, analysis.interviewQuestions.hr);
    sectionHeader(c, "Interview Questions — Scenario");
    bullets(c, analysis.interviewQuestions.scenario);

    // Scorecard chart
    sectionHeader(c, "Resume Scorecard");
    const sc = drawHBars([
      { label: "Overall Quality", value: analysis.scorecard.overallResumeQuality },
      { label: "ATS Compatibility", value: analysis.scorecard.atsCompatibility },
      { label: "Keyword Optimization", value: analysis.scorecard.keywordOptimization },
      { label: "Formatting", value: analysis.scorecard.formatting },
      { label: "Experience Quality", value: analysis.scorecard.experienceQuality },
      { label: "Education", value: analysis.scorecard.education },
      { label: "Soft Skills", value: analysis.scorecard.softSkills },
    ]);
    const scH = (sc.h / sc.w) * bw;
    ensureSpace(c, scH + 4);
    pdf.addImage(sc.data, "PNG", PAGE.margin, c.y, bw, scH);
    c.y += scH + 4;
  }

  drawFooters(pdf);
  return pdf;
}