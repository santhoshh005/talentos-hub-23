import { generateObject } from "ai";
import { z } from "zod";
import { getAiModel } from "./ai-gateway.server";
import { CandidateRecordSchema, type CandidateRecord } from "./candidate-schemas";
import { mergeCandidate } from "./candidate-parse";

export const CandidateExtractInputSchema = z.object({
  resumeText: z.string().min(20, "Resume text is too short"),
  seed: z.record(z.string(), z.unknown()).optional(),
});

const SYSTEM = [
  "You are TalentOS Candidate Extractor.",
  "You read a raw resume and extract structured recruiter fields as strict JSON.",
  'Never invent values. If a field is absent, use "" or []. Return ONLY raw JSON — no markdown, no prose.',
].join(" ");

function buildPrompt(resumeText: string): string {
  return `Extract the candidate record from this resume. Copy verbatim where possible. Never fabricate.\n\nRESUME TEXT:\n${resumeText.slice(0, 28000)}`;
}

export async function runExtractCandidate(
  resumeText: string,
  seed?: Partial<CandidateRecord>,
): Promise<CandidateRecord> {
  const seedRecord = seed ?? {};
  const seedMerged = (llm: Partial<CandidateRecord>): CandidateRecord =>
    CandidateRecordSchema.parse(mergeCandidate(llm, seedRecord));

  const model = getAiModel();
  if (!model) return seedMerged({});

  const call = async () => {
    const { object } = await generateObject({
      model,
      temperature: 0,
      schema: CandidateRecordSchema,
      system: SYSTEM,
      prompt: buildPrompt(resumeText.trim()),
    });
    return seedMerged(coerce(object));
  };

  try {
    return await call();
  } catch (err) {
    console.warn("[candidate-extract] first attempt failed, retrying", err);
    await delay(1000);
    try {
      return await call();
    } catch (err2) {
      console.error("[candidate-extract] failed twice", err2);
      return seedMerged({});
    }
  }
}

function coerce(raw: unknown): Partial<CandidateRecord> {
  // Zod schema is fully defaulted, but sanitize obvious nulls first.
  const safe = walkNullToEmpty(raw);
  const parsed = CandidateRecordSchema.safeParse(safe);
  return parsed.success ? parsed.data : {};
}

function walkNullToEmpty(value: unknown): unknown {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(walkNullToEmpty);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walkNullToEmpty(v);
    }
    return out;
  }
  return value;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    // Extract first {...} block
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    return {};
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
