import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

// ============================================================
// TalentOS Resume Intelligence Engine
// AI-first, domain-agnostic, semantic matching + weighted scoring.
// Backward-compatible with the existing UI/PDF shape; adds
// optional recruiter-intelligence fields.
// ============================================================

export const InputSchema = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().min(1),
  candidateName: z.string().optional(),
});

export const ParseInputSchema = z.object({
  resumeText: z.string().min(20),
});

// -------- Parsed resume (backward compatible + optional intel) --------
export const ParsedResumeSchema = z.object({
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

  // Optional intelligence
  domain: z.string().optional(),
  industry: z.string().optional(),
  seniority: z.string().optional(),
  primaryProfession: z.string().optional(),
  secondaryProfession: z.string().optional(),
  totalYears: z.number().optional(),
  noticePeriod: z.string().optional(),
  expectedRole: z.string().optional(),
  languages: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  confidence: z
    .object({
      skills: z.number(),
      experience: z.number(),
      education: z.number(),
      projects: z.number(),
      overall: z.number(),
    })
    .optional(),
});
export type ParsedResumeData = z.infer<typeof ParsedResumeSchema>;

// -------- Analysis (backward compatible + optional intel) --------
export const AnalysisSchema = z.object({
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

  // Optional recruiter intelligence
  scoreReason: z.string().optional(),
  scoreBreakdown: z
    .object({
      skills: z.number(),
      experience: z.number(),
      domain: z.number(),
      industry: z.number(),
      tools: z.number(),
      certifications: z.number(),
      progression: z.number(),
    })
    .optional(),
  recruiterInsights: z
    .object({
      candidateSummary: z.string(),
      topStrengths: z.array(z.string()),
      possibleRisks: z.array(z.string()),
      interviewFocus: z.array(z.string()),
      redFlags: z.array(z.string()),
      careerStability: z.string(),
      likelySalaryBand: z.string(),
      noticePeriod: z.string(),
      currentEmployer: z.string(),
      expectedRole: z.string(),
    })
    .optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  seniority: z.string().optional(),
});
export type ResumeAnalysis = z.infer<typeof AnalysisSchema>;

type ParsedInput = z.infer<typeof ParseInputSchema>;
type AnalysisInput = z.infer<typeof InputSchema>;

// ============================================================
// Skill normalization (aliases only — no hardcoded tech list)
// ============================================================
const ALIAS_MAP: Record<string, string> = {
  js: "JavaScript", javascript: "JavaScript",
  ts: "TypeScript", typescript: "TypeScript",
  "node.js": "Node.js", nodejs: "Node.js", "node js": "Node.js", node: "Node.js",
  reactjs: "React", "react.js": "React", react: "React",
  nextjs: "Next.js", "next.js": "Next.js",
  "ms excel": "Excel", "microsoft excel": "Excel", excel: "Excel",
  "azure devops": "Azure DevOps", ado: "Azure DevOps", "azure devops (ado)": "Azure DevOps",
  "spring boot": "Spring Boot", springboot: "Spring Boot",
  "rest api": "REST APIs", "rest apis": "REST APIs", "restful apis": "REST APIs", "restful api": "REST APIs",
  ml: "Machine Learning", "machine learning": "Machine Learning",
  ai: "Artificial Intelligence",
  nlp: "Natural Language Processing",
  "gcp": "Google Cloud", "google cloud platform": "Google Cloud",
  aws: "AWS", "amazon web services": "AWS",
  k8s: "Kubernetes", kubernetes: "Kubernetes",
  "ta": "Talent Acquisition", "talent acquisition": "Talent Acquisition",
  "hr recruitment": "Talent Acquisition", recruiting: "Recruitment", hiring: "Recruitment",
  sourcing: "Sourcing", "candidate search": "Sourcing",
  "power bi": "Power BI", powerbi: "Power BI",
};

function normalizeSkill(raw: string): string {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return s;
  const key = s.toLowerCase();
  if (ALIAS_MAP[key]) return ALIAS_MAP[key];
  // title-case fallback for lowercase words, preserve acronyms
  if (/^[A-Z0-9+.#/-]+$/.test(s)) return s;
  return s
    .split(/\s+/)
    .map((w) => (w.length <= 3 ? w.toUpperCase() === w ? w : w[0].toUpperCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function normalizeList(arr: unknown, cap = 40): string[] {
  const list = Array.isArray(arr) ? arr : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const s = typeof item === "string" ? normalizeSkill(item) : "";
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= cap) break;
  }
  return out;
}

// ============================================================
// Public API
// ============================================================
export async function runParseResume(data: ParsedInput): Promise<ParsedResumeData> {
  const resumeText = normalizeText(data.resumeText);
  const key = process.env.LOVABLE_API_KEY;
  const fallback = deterministicParse(resumeText);
  if (!key) return fallback;

  try {
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are the TalentOS Resume Intelligence Engine. You read resumes across ALL industries (tech, finance, HR, mechanical, healthcare, sales, leadership, freshers, etc.). You extract structured facts ONLY from the resume text. Never invent data. Never use placeholder or sample values. Return valid JSON only, no markdown fences.",
        },
        {
          role: "user",
          content: `Extract the following JSON. Use "" for unknown strings, [] for unknown lists, and 0 for unknown numbers. Do NOT hardcode tech skills — extract what the resume actually says (any industry).

{
  "name": "", "email": "", "phone": "", "location": "",
  "experience": "e.g. '5+ years' from resume",
  "totalYears": 0,
  "currentCompany": "", "expectedRole": "", "noticePeriod": "",
  "domain": "e.g. Software Engineering, Finance, HR, Mechanical…",
  "industry": "e.g. BFSI, Healthcare, SaaS, Manufacturing…",
  "seniority": "Fresher | Junior | Mid | Senior | Lead | Manager | Director | Executive",
  "primaryProfession": "", "secondaryProfession": "",
  "skills": [], "tools": [], "technologies": [], "languages": [], "softSkills": [],
  "education": "one-line summary of highest education",
  "projects": ["short project descriptors"],
  "certifications": [],
  "achievements": [],
  "confidence": { "skills": 0-100, "experience": 0-100, "education": 0-100, "projects": 0-100, "overall": 0-100 }
}

Normalize skill names (e.g. "JS" -> "JavaScript", "NodeJS" -> "Node.js", "ADO" -> "Azure DevOps"). Deduplicate.

RESUME TEXT:
${resumeText.slice(0, 28000)}`,
        },
      ],
    });
    const ai = parseJsonObject(text) as Record<string, unknown>;
    return mergeParsed(ai, fallback);
  } catch (err) {
    console.error("[TalentOS] AI parse failed; falling back to deterministic.", err);
    return fallback;
  }
}

export async function runAnalyzeResumeMatch(data: AnalysisInput): Promise<ResumeAnalysis> {
  const local = deterministicAnalysis(data.resumeText, data.jobDescription, data.candidateName);
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return local;

  try {
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are the TalentOS Resume Intelligence Engine — reasoning like a senior recruiter with 20 years of experience across ALL industries (not a keyword matcher). Use semantic understanding: 'REST APIs' matches 'API Development'; 'Candidate Screening' matches 'Recruiting/Sourcing'; 'React' == 'ReactJS'. Return valid JSON only. No markdown fences. Never invent facts.",
        },
        {
          role: "user",
          content: `Compare RESUME vs JOB DESCRIPTION and return JSON with EXACT keys below.

Scoring — return each category 0-100, judged semantically (not keyword overlap):
- skills, experience, domain, industry, tools, certifications, progression

Also return legacy scores (0-100): technicalSkills, experience, education, communication, cultureFit
And scorecard (0-100): overallResumeQuality, atsCompatibility, keywordOptimization, formatting, experienceQuality, education, softSkills

matchingSkills: normalized skills present in BOTH resume and JD (semantic match allowed).
missingSkills: JD-required skills NOT in resume.
additionalSkills: valuable resume skills not asked by JD.
Deduplicate. Normalize (JS->JavaScript, NodeJS->Node.js, ADO->Azure DevOps, MS Excel->Excel).

scoreReason: 1-2 sentence explanation (e.g. "Excellent domain fit. Strong technical alignment. Missing only Kubernetes.").

recruiterInsights: {
  candidateSummary, topStrengths[], possibleRisks[], interviewFocus[], redFlags[],
  careerStability, likelySalaryBand, noticePeriod, currentEmployer, expectedRole
}

Also: domain, industry, seniority.

Full JSON keys:
{
  "domain":"", "industry":"", "seniority":"",
  "scoreBreakdown": {"skills":0,"experience":0,"domain":0,"industry":0,"tools":0,"certifications":0,"progression":0},
  "scoreReason": "",
  "scores": {"technicalSkills":0,"experience":0,"education":0,"communication":0,"cultureFit":0},
  "matchingSkills": [], "additionalSkills": [], "missingSkills": [],
  "summary": "", "strengths": [], "weaknesses": [], "resumeImprovements": [],
  "hiringRecommendation": "",
  "interviewQuestions": {"technical":[], "hr":[], "scenario":[]},
  "scorecard": {"overallResumeQuality":0,"atsCompatibility":0,"keywordOptimization":0,"formatting":0,"experienceQuality":0,"education":0,"softSkills":0},
  "recruiterInsights": {"candidateSummary":"","topStrengths":[],"possibleRisks":[],"interviewFocus":[],"redFlags":[],"careerStability":"","likelySalaryBand":"","noticePeriod":"","currentEmployer":"","expectedRole":""}
}

Keep each array to 3-8 focused items.

RESUME:
${data.resumeText.slice(0, 18000)}

JOB DESCRIPTION:
${data.jobDescription.slice(0, 8000)}`,
        },
      ],
    });
    const ai = parseJsonObject(text) as Record<string, unknown>;
    return finalizeAnalysis(ai, local, data.candidateName);
  } catch (err) {
    console.error("[TalentOS] AI analysis failed; falling back to deterministic.", err);
    return local;
  }
}

// ============================================================
// Weighted score computation (35/20/15/10/10/5/5)
// ============================================================
function computeWeightedScore(b: {
  skills: number; experience: number; domain: number; industry: number;
  tools: number; certifications: number; progression: number;
}): number {
  const raw =
    b.skills * 0.35 +
    b.experience * 0.20 +
    b.domain * 0.15 +
    b.industry * 0.10 +
    b.tools * 0.10 +
    b.certifications * 0.05 +
    b.progression * 0.05;
  return clampScore(raw);
}

function verdictFromScore(score: number): string {
  if (score >= 85) return "Strong Match";
  if (score >= 70) return "Good Match";
  if (score >= 55) return "Potential Match";
  return "Needs Review";
}

// ============================================================
// Merge / finalize
// ============================================================
function mergeParsed(ai: Record<string, unknown>, fb: ParsedResumeData): ParsedResumeData {
  const str = (k: string, f = "") => (typeof ai[k] === "string" && (ai[k] as string).trim() ? (ai[k] as string).trim() : f);
  const num = (k: string, f = 0) => (typeof ai[k] === "number" && Number.isFinite(ai[k]) ? (ai[k] as number) : f);
  const conf = ai.confidence as Record<string, unknown> | undefined;

  return ParsedResumeSchema.parse({
    name: str("name", fb.name) || "Not Found",
    email: str("email", fb.email) || "Not Found",
    phone: str("phone", fb.phone) || "Not Found",
    location: str("location", fb.location) || "Not Found",
    experience: str("experience", fb.experience) || "Not Found",
    currentCompany: str("currentCompany", fb.currentCompany) || "Not Found",
    education: str("education", fb.education) || "Not Found",
    skills: normalizeList(ai.skills ?? fb.skills, 40),
    projects: normalizeList(ai.projects ?? fb.projects, 12),
    certifications: normalizeList(ai.certifications ?? fb.certifications, 18),
    technologies: normalizeList(ai.technologies ?? fb.technologies, 40),
    tools: normalizeList(ai.tools, 40),
    languages: normalizeList(ai.languages, 20),
    softSkills: normalizeList(ai.softSkills, 20),
    achievements: normalizeList(ai.achievements, 12),
    domain: str("domain") || undefined,
    industry: str("industry") || undefined,
    seniority: str("seniority") || undefined,
    primaryProfession: str("primaryProfession") || undefined,
    secondaryProfession: str("secondaryProfession") || undefined,
    totalYears: num("totalYears") || undefined,
    noticePeriod: str("noticePeriod") || undefined,
    expectedRole: str("expectedRole") || undefined,
    confidence: conf
      ? {
          skills: clampScore(numberOr(conf.skills, 85)),
          experience: clampScore(numberOr(conf.experience, 85)),
          education: clampScore(numberOr(conf.education, 90)),
          projects: clampScore(numberOr(conf.projects, 80)),
          overall: clampScore(numberOr(conf.overall, 85)),
        }
      : undefined,
  });
}

function finalizeAnalysis(ai: Record<string, unknown>, fb: ResumeAnalysis, candidateName?: string): ResumeAnalysis {
  const scoresObj = (ai.scores as Record<string, unknown>) ?? {};
  const cardObj = (ai.scorecard as Record<string, unknown>) ?? {};
  const qObj = (ai.interviewQuestions as Record<string, unknown>) ?? {};
  const brkObj = (ai.scoreBreakdown as Record<string, unknown>) ?? {};
  const insObj = (ai.recruiterInsights as Record<string, unknown>) ?? {};

  const breakdown = {
    skills: clampScore(numberOr(brkObj.skills, numberOr(scoresObj.technicalSkills, 60))),
    experience: clampScore(numberOr(brkObj.experience, numberOr(scoresObj.experience, 60))),
    domain: clampScore(numberOr(brkObj.domain, 60)),
    industry: clampScore(numberOr(brkObj.industry, 60)),
    tools: clampScore(numberOr(brkObj.tools, numberOr(scoresObj.technicalSkills, 55))),
    certifications: clampScore(numberOr(brkObj.certifications, 50)),
    progression: clampScore(numberOr(brkObj.progression, 60)),
  };
  const overall = computeWeightedScore(breakdown);

  const matching = normalizeList(ai.matchingSkills, 20);
  const missing = normalizeList(ai.missingSkills, 20);
  // Additional = resume signals not in matching
  const additionalRaw = normalizeList(ai.additionalSkills, 30);
  const matchKeys = new Set(matching.map((s) => s.toLowerCase()));
  const additional = additionalRaw.filter((s) => !matchKeys.has(s.toLowerCase())).slice(0, 20);

  const candidate = candidateName || "Candidate";

  return AnalysisSchema.parse({
    overallScore: overall,
    verdict: verdictFromScore(overall),
    scores: {
      technicalSkills: breakdown.skills,
      experience: breakdown.experience,
      education: clampScore(numberOr(scoresObj.education, 70)),
      communication: clampScore(numberOr(scoresObj.communication, 70)),
      cultureFit: clampScore(numberOr(scoresObj.cultureFit, breakdown.domain)),
    },
    matchingSkills: matching,
    additionalSkills: additional,
    missingSkills: missing,
    summary: cleanString(ai.summary) || `${candidate}: ${verdictFromScore(overall)} against the JD.`,
    strengths: toStringArray(ai.strengths, fb.strengths),
    weaknesses: toStringArray(ai.weaknesses, fb.weaknesses),
    resumeImprovements: toStringArray(ai.resumeImprovements, fb.resumeImprovements),
    hiringRecommendation: cleanString(ai.hiringRecommendation) || fb.hiringRecommendation,
    interviewQuestions: {
      technical: toStringArray(qObj.technical, fb.interviewQuestions.technical),
      hr: toStringArray(qObj.hr, fb.interviewQuestions.hr),
      scenario: toStringArray(qObj.scenario, fb.interviewQuestions.scenario),
    },
    scorecard: {
      overallResumeQuality: clampScore(numberOr(cardObj.overallResumeQuality, 70)),
      atsCompatibility: clampScore(numberOr(cardObj.atsCompatibility, 70)),
      keywordOptimization: clampScore(numberOr(cardObj.keywordOptimization, breakdown.skills)),
      formatting: clampScore(numberOr(cardObj.formatting, 70)),
      experienceQuality: clampScore(numberOr(cardObj.experienceQuality, breakdown.experience)),
      education: clampScore(numberOr(cardObj.education, 70)),
      softSkills: clampScore(numberOr(cardObj.softSkills, 70)),
    },
    scoreReason: cleanString(ai.scoreReason) || undefined,
    scoreBreakdown: breakdown,
    recruiterInsights: {
      candidateSummary: cleanString(insObj.candidateSummary) || cleanString(ai.summary) || "",
      topStrengths: toStringArray(insObj.topStrengths, []),
      possibleRisks: toStringArray(insObj.possibleRisks, []),
      interviewFocus: toStringArray(insObj.interviewFocus, []),
      redFlags: toStringArray(insObj.redFlags, []),
      careerStability: cleanString(insObj.careerStability) || "Not Found",
      likelySalaryBand: cleanString(insObj.likelySalaryBand) || "Not Found",
      noticePeriod: cleanString(insObj.noticePeriod) || "Not Found",
      currentEmployer: cleanString(insObj.currentEmployer) || "Not Found",
      expectedRole: cleanString(insObj.expectedRole) || "Not Found",
    },
    domain: cleanString(ai.domain) || undefined,
    industry: cleanString(ai.industry) || undefined,
    seniority: cleanString(ai.seniority) || undefined,
  });
}

// ============================================================
// Deterministic fallback (never hardcoded to tech domain)
// ============================================================
function deterministicParse(text: string): ParsedResumeData {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const email = text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0] ?? "";
  const phone = text.match(/(?:\+?\d[\d\s().-]{8,}\d)/)?.[0]?.trim() ?? "";
  const yearsMatch = text.match(/\b(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\b/i);
  const experience = yearsMatch?.[0] ?? "";
  const totalYears = yearsMatch ? Number(yearsMatch[1]) : 0;

  const name = lines.slice(0, 8).find((l) => l.length >= 3 && l.length <= 60 && /[a-z]/i.test(l) && !l.includes("@") && !/\d{5,}/.test(l)) ?? "";

  return ParsedResumeSchema.parse({
    name: name || "Not Found",
    email: email || "Not Found",
    phone: phone || "Not Found",
    location: "Not Found",
    experience: experience || "Not Found",
    currentCompany: "Not Found",
    skills: [],
    education: "Not Found",
    projects: [],
    certifications: [],
    technologies: [],
    tools: [],
    languages: [],
    softSkills: [],
    achievements: [],
    totalYears: totalYears || undefined,
  });
}

function deterministicAnalysis(resumeText: string, jd: string, candidateName?: string): ResumeAnalysis {
  const breakdown = { skills: 55, experience: 55, domain: 55, industry: 55, tools: 50, certifications: 45, progression: 55 };
  const overall = computeWeightedScore(breakdown);
  const candidate = candidateName || "Candidate";
  return AnalysisSchema.parse({
    overallScore: overall,
    verdict: verdictFromScore(overall),
    scores: { technicalSkills: 55, experience: 55, education: 60, communication: 65, cultureFit: 55 },
    matchingSkills: [],
    additionalSkills: [],
    missingSkills: [],
    summary: `${candidate}: AI unavailable — deterministic fallback. Enable AI for full recruiter intelligence.`,
    strengths: ["Resume text extracted successfully."],
    weaknesses: ["Detailed AI matching unavailable."],
    resumeImprovements: ["Ensure clear section headings for skills, experience, and education."],
    hiringRecommendation: "Review manually before shortlisting.",
    interviewQuestions: {
      technical: ["Walk me through your most impactful project."],
      hr: ["What type of role are you targeting next?"],
      scenario: ["How would you approach ramping up in a new role?"],
    },
    scorecard: {
      overallResumeQuality: 65, atsCompatibility: 65, keywordOptimization: 55,
      formatting: 65, experienceQuality: 60, education: 60, softSkills: 65,
    },
    scoreBreakdown: breakdown,
    scoreReason: "AI unavailable — using deterministic baseline.",
  });
}

// ============================================================
// Utils
// ============================================================
function normalizeText(t: string): string {
  return t.replace(/\r\n?/g, "\n").replace(/[\u00a0\t]+/g, " ").replace(/[ ]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function parseJsonObject(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return {}; }
}
function cleanString(v: unknown): string { return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : ""; }
function toStringArray(v: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(v)) {
    const out = v.map(cleanString).filter(Boolean);
    return out.length ? Array.from(new Set(out)) : fallback;
  }
  return fallback;
}
function numberOr(v: unknown, f: number): number { return typeof v === "number" && Number.isFinite(v) ? v : f; }
function clampScore(v: number): number { return Math.max(0, Math.min(100, Math.round(v))); }
