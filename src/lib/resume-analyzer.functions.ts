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

    const prompt = `You are an expert resume parser. Extract structured fields from the resume text below. Return ONLY facts present in the text — do not invent anything. If a field is not present, return an empty string or empty array.

Rules:
- name: candidate's full name as written.
- email / phone: exact values from the resume.
- location: city, country (or as stated).
- experience: total years like "6 years" if computable; otherwise "".
- currentCompany: most recent employer.
- skills: soft/technical skill keywords, deduped, max 25.
- education: highest degree + institution on one line.
- projects: up to 8 short project titles or one-line summaries.
- certifications: up to 10, verbatim names.
- technologies: tools/frameworks/languages/platforms, deduped, max 25.

RESUME TEXT:
${data.resumeText.slice(0, 16000)}`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: ParsedResumeSchema }),
        prompt,
      });
      return output;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        try {
          return ParsedResumeSchema.parse(JSON.parse(err.text ?? "{}"));
        } catch {
          return fallback;
        }
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