import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { CandidateRecordSchema, type CandidateRecord } from "./candidate-schemas";

const MODEL = "google/gemini-3.6-flash";

export const CandidateExtractInputSchema = z.object({
  resumeText: z.string().min(20, "Resume text is too short"),
});

const SYSTEM = [
  "You are TalentOS Candidate Extractor.",
  "You read a raw resume and extract structured recruiter fields as strict JSON.",
  "Never invent values. If a field is absent, use \"\" or []. Return ONLY raw JSON — no markdown, no prose.",
].join(" ");

function buildPrompt(resumeText: string): string {
  return `Return ONE JSON object with EXACTLY these keys:

{
  "fullName": string,
  "headline": string,              // e.g. "Senior Java Developer"
  "summary": string,               // 2-3 sentence professional summary
  "email": string,
  "mobile": string,
  "linkedin": string,              // Full URL if present
  "github": string,
  "portfolio": string,
  "currentCompany": string,
  "currentDesignation": string,
  "employmentType": string,        // Full-Time | Contract | Freelance | ""
  "previousEmployment": [ { "company": string, "title": string, "start": string, "end": string, "isCurrent": boolean } ],
  "totalExperience": string,       // e.g. "7 years"
  "relevantExperience": string,
  "primarySkills": string[],       // Top 6-10 core skills
  "secondarySkills": string[],     // Additional tools / methodologies
  "currentLocation": string,
  "preferredLocation": string,
  "currentCTC": string,
  "expectedCTC": string,
  "noticePeriod": string,
  "currentOffer": string,
  "reasonForChange": string,
  "education": [ { "degree": string, "institution": string, "year": string } ],
  "certifications": string[],
  "pan": string,
  "passport": string,
  "visaStatus": string
}

RULES:
1. Copy verbatim where possible. Never fabricate.
2. previousEmployment: newest first, exclude the current role.
3. Multi-word skills stay together ("Sales Cloud", "Spring Boot").
4. Absent field -> "" or [].
5. Return ONLY the JSON object.

RESUME TEXT:
${resumeText.slice(0, 28000)}`;
}

export async function runExtractCandidate(resumeText: string): Promise<CandidateRecord> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return CandidateRecordSchema.parse({});
  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway(MODEL);

  const call = async () => {
    const { text } = await generateText({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildPrompt(resumeText.trim()) },
      ],
    });
    return coerce(parseJsonObject(text));
  };

  try {
    return await call();
  } catch (err) {
    console.warn("[candidate-extract] first attempt failed, retrying", err);
    try {
      return await call();
    } catch (err2) {
      console.error("[candidate-extract] failed twice", err2);
      return CandidateRecordSchema.parse({});
    }
  }
}

function coerce(raw: unknown): CandidateRecord {
  // Zod schema is fully defaulted, but sanitize obvious nulls first.
  const safe = walkNullToEmpty(raw);
  const parsed = CandidateRecordSchema.safeParse(safe);
  return parsed.success ? parsed.data : CandidateRecordSchema.parse({});
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