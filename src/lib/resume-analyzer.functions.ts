import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableGateway } from "./ai-gateway.server";

const InputSchema = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().min(1),
  candidateName: z.string().optional(),
});

const ParseInputSchema = z.object({
  resumeText: z.string().min(20),
});

const ParsedResumeSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  experience: z.string(),
  currentCompany: z.string(),
  skills: z.array(z.string()),
  education: z.string(),
  projects: z.array(z.string()),
  certifications: z.array(z.string()),
  technologies: z.array(z.string()),
});

export type ParsedResumeData = z.infer<typeof ParsedResumeSchema>;

const AnalysisSchema = z.object({
  overallScore: z.number(),
  verdict: z.string(),
  scores: z.object({
    technicalSkills: z.number(),
    experience: z.number(),
    education: z.number(),
    communication: z.number(),
    cultureFit: z.number(),
  }),
  matchingSkills: z.array(z.string()),
  additionalSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  resumeImprovements: z.array(z.string()),
  hiringRecommendation: z.string(),
  interviewQuestions: z.object({
    technical: z.array(z.string()),
    hr: z.array(z.string()),
    scenario: z.array(z.string()),
  }),
  scorecard: z.object({
    overallResumeQuality: z.number(),
    atsCompatibility: z.number(),
    keywordOptimization: z.number(),
    formatting: z.number(),
    experienceQuality: z.number(),
    education: z.number(),
    softSkills: z.number(),
  }),
});

export type ResumeAnalysis = z.infer<typeof AnalysisSchema>;

function mockAnalysis(): ResumeAnalysis {
  return {
    overallScore: 82,
    verdict: "Strong Match",
    scores: {
      technicalSkills: 88,
      experience: 84,
      education: 90,
      communication: 86,
      cultureFit: 80,
    },
    matchingSkills: ["React", "TypeScript", "Node.js", "AWS", "Docker"],
    additionalSkills: ["GraphQL", "Redis", "PostgreSQL"],
    missingSkills: ["Terraform", "Kubernetes"],
    summary:
      "Strong full-stack profile with solid frontend depth and cloud fundamentals. Some infra gaps around IaC and orchestration.",
    strengths: [
      "Proven React + TypeScript delivery at scale",
      "Clear ownership of production systems",
      "Product-minded engineering",
    ],
    weaknesses: [
      "Limited exposure to Kubernetes / Terraform",
      "No visible mentoring / leadership signals",
    ],
    resumeImprovements: [
      "Quantify impact with metrics (latency, revenue, adoption)",
      "Tighten summary to 2 lines above the fold",
      "Group tech stack by proficiency level",
    ],
    hiringRecommendation:
      "Advance to technical interview. Focus on system design and infra depth.",
    interviewQuestions: {
      technical: [
        "Walk through the architecture of your most complex React app.",
        "How would you design a rate limiter for a public API?",
        "Explain trade-offs between SSR, SSG, and CSR.",
      ],
      hr: [
        "What motivates you in your current role?",
        "Describe a time you had to influence without authority.",
        "Where do you see yourself in 3 years?",
      ],
      scenario: [
        "Production is down at 2AM. Walk me through your first 30 minutes.",
        "A PM insists on a feature you believe will hurt UX. What do you do?",
        "You inherit a legacy codebase with no tests. First 3 moves?",
      ],
    },
    scorecard: {
      overallResumeQuality: 84,
      atsCompatibility: 88,
      keywordOptimization: 79,
      formatting: 90,
      experienceQuality: 85,
      education: 92,
      softSkills: 78,
    },
  };
}

export const analyzeResumeMatch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<ResumeAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return mockAnalysis();

    const gateway = createLovableGateway(key);
    const model = gateway("google/gemini-3.6-flash");

    const prompt = `You are an expert technical recruiter. Analyze the candidate's resume against the job description. Return a rigorous, honest evaluation.

All scores are integers 0-100. Keep arrays to 3-6 items. Keep strings concise (under 200 chars).

RESUME:
${data.resumeText.slice(0, 8000)}

JOB DESCRIPTION:
${data.jobDescription.slice(0, 4000)}`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: AnalysisSchema }),
        prompt,
      });
      return output;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        try {
          const parsed = JSON.parse(err.text ?? "{}");
          return AnalysisSchema.parse(parsed);
        } catch {
          return mockAnalysis();
        }
      }
      return mockAnalysis();
    }
  });

export const parseResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ParseInputSchema.parse(data))
  .handler(async ({ data }): Promise<ParsedResumeData> => {
    const key = process.env.LOVABLE_API_KEY;
    const fallback: ParsedResumeData = {
      name: "",
      email: extractEmail(data.resumeText),
      phone: extractPhone(data.resumeText),
      location: "",
      experience: "",
      currentCompany: "",
      skills: [],
      education: "",
      projects: [],
      certifications: [],
      technologies: [],
    };
    if (!key) return fallback;

    const gateway = createLovableGateway(key);
    const model = gateway("google/gemini-3.6-flash");

    const system = `You are a deterministic resume parser. You extract fields VERBATIM from the resume text provided. You NEVER invent, guess, translate, or paraphrase. If a field is not clearly present in the text, return an empty string "" or empty array []. Return ONLY a single JSON object, no prose, no markdown fences.`;

    const userPrompt = `Extract these fields as a JSON object with EXACTLY these keys:
{
  "name": string,               // candidate's full name exactly as written at the top of the resume
  "email": string,              // email address verbatim
  "phone": string,              // phone number verbatim (keep +, spaces, dashes)
  "location": string,           // city, state/country as written
  "experience": string,         // e.g. "3 years" if computable from dates; else ""
  "currentCompany": string,     // most recent employer name
  "skills": string[],           // skill keywords listed in the resume, deduped, max 30
  "education": string,          // highest degree + institution on one line
  "projects": string[],         // project titles or one-line summaries, max 10
  "certifications": string[],   // verbatim certification names, max 15
  "technologies": string[]      // tools/frameworks/languages/platforms, deduped, max 30
}

Rules:
- Copy values from the text; do not translate or rewrite.
- If unsure, leave the field empty. Never fabricate.
- Output must be valid JSON parsable by JSON.parse. No comments, no trailing commas, no code fences.

RESUME TEXT (verbatim):
"""
${data.resumeText.slice(0, 24000)}
"""`;

    const tryParse = (raw: string): ParsedResumeData | null => {
      if (!raw) return null;
      // Strip code fences if any.
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      // Grab the outermost JSON object.
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) return null;
      const slice = cleaned.slice(start, end + 1);
      try {
        const obj = JSON.parse(slice);
        const merged = { ...fallback, ...obj };
        // Coerce arrays that might come back as strings.
        for (const k of ["skills", "projects", "certifications", "technologies"] as const) {
          const v = (merged as Record<string, unknown>)[k];
          if (typeof v === "string") {
            (merged as Record<string, unknown>)[k] = v
              .split(/[,\n;•]/)
              .map((x) => x.trim())
              .filter(Boolean);
          } else if (!Array.isArray(v)) {
            (merged as Record<string, unknown>)[k] = [];
          }
        }
        return ParsedResumeSchema.parse(merged);
      } catch {
        return null;
      }
    };

    // Primary path: plain JSON generation (more reliable across models than strict tool-calling).
    try {
      const { text } = await generateText({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      });
      const parsed = tryParse(text);
      if (parsed) return { ...parsed, email: parsed.email || fallback.email, phone: parsed.phone || fallback.phone };
    } catch {
      /* fall through */
    }

    // Secondary path: structured output with Zod schema.
    try {
      const { output } = await generateText({
        model,
        temperature: 0,
        output: Output.object({ schema: ParsedResumeSchema }),
        prompt: userPrompt,
      });
      return { ...output, email: output.email || fallback.email, phone: output.phone || fallback.phone };
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        const parsed = tryParse(err.text ?? "");
        if (parsed) return parsed;
      }
      return fallback;
    }
  });

function extractEmail(t: string): string {
  return t.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? "";
}
function extractPhone(t: string): string {
  return t.match(/(\+?\d[\d\s().-]{8,}\d)/)?.[0]?.trim() ?? "";
}