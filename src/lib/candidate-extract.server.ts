import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { CandidateRecordSchema, type CandidateRecord } from "./candidate-schemas";
import { mergeCandidate } from "./candidate-parse";

const MODEL = "google/gemini-3.6-flash";

// Fields where our deterministic regex parser is more reliable than the LLM.
// If the seed has a non-empty value for these, always use the seed's value.
const HIGH_CONFIDENCE_SEED_FIELDS = [
  "email",
  "mobile",
  "linkedin",
  "github",
  "portfolio",
  "pan",
  "passport",
] as const;

const EMAIL_LIKE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_LIKE = /^\+?[\d][\d\s()\-.]{6,}$/;
const COMPANY_LIKE = /\b(ltd|llp|inc|solutions|technologies|systems|pvt|limited|corp|gmbh|consulting|services|labs|studios|group)\b/i;
const CTC_LIKE = /\b(lpa|lakh|crore|inr|₹|usd|\$|salary|per\s*(annum|month|year)|k\/yr|per year)\b|^\d+(\.\d+)?\s*(lpa|lakh)?$/i;

/**
 * Sanity pass: catch obvious value/field swaps the LLM makes and fix them.
 * Only moves a value when the destination field is empty, so we never destroy data.
 */
function sanityCorrect(record: CandidateRecord): CandidateRecord {
  const patch: Partial<Record<keyof CandidateRecord, string>> = {};
  const scalarFields: (keyof CandidateRecord)[] = [
    "currentCompany",
    "currentDesignation",
    "currentCTC",
    "expectedCTC",
    "noticePeriod",
    "currentLocation",
    "preferredLocation",
    "employmentType",
    "totalExperience",
    "relevantExperience",
  ];

  const val = (k: keyof CandidateRecord): string => {
    const v = (record as unknown as Record<string, unknown>)[k];
    return typeof v === "string" ? v.trim() : "";
  };
  const targetEmpty = (k: keyof CandidateRecord): boolean =>
    !(val(k) || patch[k]);

  // 1. Rescue emails/phones that landed in text fields.
  for (const f of scalarFields) {
    const v = val(f);
    if (!v) continue;
    if (EMAIL_LIKE.test(v) && targetEmpty("email")) {
      patch.email = (v.match(EMAIL_LIKE) ?? [""])[0];
      patch[f] = "";
      continue;
    }
    if (PHONE_LIKE.test(v) && !EMAIL_LIKE.test(v) && targetEmpty("mobile")) {
      patch.mobile = v;
      patch[f] = "";
    }
  }

  // 2. Company-shaped strings sitting in CTC fields — move them to currentCompany if that's empty.
  const isCompanyShaped = (s: string) =>
    !!s && COMPANY_LIKE.test(s) && !CTC_LIKE.test(s) && !/\d{4,}/.test(s);

  const ctcExpected = val("expectedCTC");
  const ctcCurrent = val("currentCTC");
  if (isCompanyShaped(ctcExpected) && targetEmpty("currentCompany")) {
    patch.currentCompany = ctcExpected;
    patch.expectedCTC = "";
  }
  if (isCompanyShaped(ctcCurrent) && targetEmpty("currentCompany")) {
    patch.currentCompany = ctcCurrent;
    patch.currentCTC = "";
  }

  // 3. Swap current<->expected CTC if only one is populated and it looks like a range or the other slot has clearly-not-CTC content.
  // (No-op unless both are CTC-shaped; handled implicitly above.)

  return { ...record, ...(patch as Partial<CandidateRecord>) };
}

/** Force high-confidence seed fields to win over the LLM when the seed has them. */
function overlayStrongSeed(
  merged: CandidateRecord,
  seed: Partial<CandidateRecord>,
): CandidateRecord {
  const out: Record<string, unknown> = { ...merged };
  for (const key of HIGH_CONFIDENCE_SEED_FIELDS) {
    const s = seed[key];
    if (typeof s === "string" && s.trim().length > 0) {
      out[key] = s.trim();
    }
  }
  return out as CandidateRecord;
}

export const CandidateExtractInputSchema = z.object({
  resumeText: z.string().min(20, "Resume text is too short"),
  seed: z.record(z.string(), z.unknown()).optional(),
});

const SYSTEM = [
  "You are TalentOS Candidate Extractor.",
  "You read a raw resume and extract structured recruiter fields as strict JSON.",
  "Never invent values. If a field is absent, use \"\" or []. Return ONLY raw JSON — no markdown, no prose.",
  "CRITICAL: each field must contain ONLY the type of value its name describes.",
  "email = an email address (contains @). mobile = a phone number (digits only, may start with +).",
  "currentCompany = the employer's organisation name. currentDesignation = a job title.",
  "currentCTC / expectedCTC = compensation amounts (e.g. \"18 LPA\", \"$120k\") — NEVER a company name, email, or phone.",
  "noticePeriod = a duration (e.g. \"30 days\", \"Immediate\"). Never put a company or amount there.",
  "If unsure which field a value belongs to, leave the wrong field empty rather than guessing.",
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

export async function runExtractCandidate(
  resumeText: string,
  seed?: Partial<CandidateRecord>,
): Promise<CandidateRecord> {
  const seedRecord = seed ?? {};
  const seedMerged = (llm: Partial<CandidateRecord>): CandidateRecord =>
    sanityCorrect(
      overlayStrongSeed(
        CandidateRecordSchema.parse(mergeCandidate(llm, seedRecord)),
        seedRecord,
      ),
    );

  const key = process.env.LOVABLE_API_KEY;
  if (!key) return seedMerged({});
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
    return seedMerged(coerce(parseJsonObject(text)));
  };

  try {
    return await call();
  } catch (err) {
    console.warn("[candidate-extract] first attempt failed, retrying", err);
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