import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export const InputSchema = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().min(1),
  candidateName: z.string().optional(),
});

export const ParseInputSchema = z.object({
  resumeText: z.string().min(20),
});

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
  currentDesignation: z.string().default("Not Found"),
  relevantExperience: z.string().default("Not Found"),
  employmentHistory: z.array(z.string()).default([]),
  educationHistory: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  noticePeriod: z.string().default("Not Found"),
});

export type ParsedResumeData = z.infer<typeof ParsedResumeSchema>;

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
});

export type ResumeAnalysis = z.infer<typeof AnalysisSchema>;

type ParsedInput = z.infer<typeof ParseInputSchema>;
type AnalysisInput = z.infer<typeof InputSchema>;

const SECTION_HEADERS = [
  "summary",
  "profile",
  "objective",
  "professional summary",
  "career summary",
  "career objective",
  "about me",
  "experience",
  "work experience",
  "professional experience",
  "industry experience",
  "industrial experience",
  "career history",
  "work history",
  "employment history",
  "employment",
  "education",
  "academic background",
  "academic qualifications",
  "qualifications",
  "educational qualifications",
  "skills",
  "technical skills",
  "core skills",
  "core competencies",
  "competencies",
  "key skills",
  "professional skills",
  "functional skills",
  "areas of expertise",
  "expertise",
  "domain expertise",
  "specializations",
  "proficiencies",
  "technical proficiencies",
  "tools",
  "tools & technologies",
  "tools and technologies",
  "software",
  "platforms",
  "technologies",
  "projects",
  "key projects",
  "major projects",
  "academic projects",
  "personal projects",
  "assignments",
  "certifications",
  "certificates",
  "licenses",
  "trainings",
  "achievements",
  "accomplishments",
  "awards",
  "publications",
  "languages",
  "languages known",
  "hobbies",
  "interests",
  "references",
];

const KNOWN_TECHNOLOGIES = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "Python",
  "Java",
  "C",
  "C++",
  "C#",
  "SQL",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "Git",
  "Linux",
  "HTML",
  "CSS",
  "Tailwind",
  "Machine Learning",
  "Deep Learning",
  "NLP",
  "TensorFlow",
  "PyTorch",
  "Pandas",
  "NumPy",
  "Scikit-learn",
  "Power BI",
  "Tableau",
  "Excel",
  "Data Analytics",
  "Artificial Intelligence",
  "REST API",
  "GraphQL",
];

export async function runParseResume(data: ParsedInput): Promise<ParsedResumeData> {
  const resumeText = normalizeText(data.resumeText);
  const local = parseResumeLocally(resumeText);
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return finalizeNotFound(local);

  try {
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      temperature: 0,
      messages: [
        {
          role: "system",
          content: [
            "You are TalentOS Resume Parser — a domain-agnostic parser that works across ALL industries:",
            "IT, Talent Acquisition, HR, Finance, Banking, Accounting, Sales, Marketing, Healthcare, Pharma,",
            "Manufacturing, Mechanical / Civil / Electrical / Electronics / Embedded / Automotive / Aerospace",
            "engineering, Legal, Operations, Customer Support, Freshers, and Executive profiles.",
            "",
            "Understand the MEANING and STRUCTURE of the resume — never rely on hard-coded keywords.",
            "Section titles vary wildly (Technical Skills / Core Competencies / Areas of Expertise /",
            "Professional Skills / Functional Skills / Proficiencies): treat them as the same 'skills' bucket.",
            "Extract every value ONLY from what the candidate wrote. Never invent, guess, translate,",
            "reuse sample data, or add placeholders.",
            "Return ONLY valid JSON — no prose, no markdown fences.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Return ONE JSON object with EXACTLY these keys:

{
  "name": string,                 // Full name of the candidate
  "email": string,
  "phone": string,                // Include country code if present
  "location": string,             // Current city / state / country
  "currentDesignation": string,   // Latest job title / role
  "currentCompany": string,       // Latest employer
  "experience": string,           // Total experience e.g. "6.5 years"
  "relevantExperience": string,   // Relevant experience if explicitly mentioned
  "noticePeriod": string,         // e.g. "30 days", "Immediate", "Serving notice"
  "education": string,            // Highest / most recent qualification on one line
  "educationHistory": string[],   // Every education entry, newest first: "Degree — Institution (Year)"
  "employmentHistory": string[],  // Every job: "Designation — Company (Duration)". Newest first.
  "skills": string[],             // Unified from Skills / Core Competencies / Expertise / Proficiencies
  "tools": string[],              // Software / platforms / instruments the candidate uses
  "technologies": string[],       // Technologies / frameworks / stacks
  "projects": string[],           // "Project Name — Role — Technologies — Responsibilities" (one per project)
  "certifications": string[],     // Every certification / license / training
  "languages": string[]           // Spoken languages
}

STRICT RULES:
1. Copy values EXACTLY as they appear in the resume. Preserve original casing where reasonable.
2. If a scalar value is not present, return the string "Not Found" (never "", never null, never guessed).
3. If a list has no entries, return [].
4. Merge synonymous sections into their unified bucket (e.g. "Core Competencies" -> skills).
5. For employmentHistory / educationHistory / projects, extract EVERY entry — do not stop at 2 or 3.
6. Never include markdown, commentary, or code fences. Return the raw JSON object only.

RESUME TEXT:
${resumeText.slice(0, 28000)}`,
        },
      ],
    });
    return finalizeNotFound(mergeParsedResume(parseJsonObject(text), local, resumeText));
  } catch (error) {
    console.error("[TalentOS resume parser] AI extraction failed; using deterministic extraction.", error);
    return finalizeNotFound(local);
  }
}

function finalizeNotFound(parsed: ParsedResumeData): ParsedResumeData {
  const scalar = (v: string) => (v && v.trim() ? v.trim() : "Not Found");
  return {
    ...parsed,
    name: scalar(parsed.name),
    email: scalar(parsed.email),
    phone: scalar(parsed.phone),
    location: scalar(parsed.location),
    experience: scalar(parsed.experience),
    currentCompany: scalar(parsed.currentCompany),
    education: scalar(parsed.education),
    currentDesignation: scalar(parsed.currentDesignation ?? ""),
    relevantExperience: scalar(parsed.relevantExperience ?? ""),
    noticePeriod: scalar(parsed.noticePeriod ?? ""),
  };
}

export async function runAnalyzeResumeMatch(data: AnalysisInput): Promise<ResumeAnalysis> {
  const local = createLocalAnalysis(data.resumeText, data.jobDescription, data.candidateName);
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
            "You are a senior technical recruiter. Analyze the exact resume against the exact job description. Never use mock data. Return only valid JSON matching the requested keys.",
        },
        {
          role: "user",
          content: `Return JSON with these keys:
overallScore number 0-100, verdict string, scores { technicalSkills, experience, education, communication, cultureFit }, matchingSkills string[], additionalSkills string[], missingSkills string[], summary string, strengths string[], weaknesses string[], resumeImprovements string[], hiringRecommendation string, interviewQuestions { technical string[], hr string[], scenario string[] }, scorecard { overallResumeQuality, atsCompatibility, keywordOptimization, formatting, experienceQuality, education, softSkills }.

Keep arrays to 3-7 items and base every item on the supplied resume/JD.

RESUME:
${data.resumeText.slice(0, 18000)}

JOB DESCRIPTION:
${data.jobDescription.slice(0, 8000)}`,
        },
      ],
    });
    return normalizeAnalysis(parseJsonObject(text), local);
  } catch (error) {
    console.error("[TalentOS resume analyzer] AI matching failed; using deterministic text match.", error);
    return local;
  }
}

function parseResumeLocally(rawText: string): ParsedResumeData {
  const text = normalizeText(rawText);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const skillsFromSection = splitList(sectionText(lines, ["skills", "technical skills", "core skills", "tools", "technologies"], 28));
  const technologies = unique([...skillsFromSection, ...findKnownTerms(text, KNOWN_TECHNOLOGIES)]).slice(0, 40);
  const projects = extractSectionItems(lines, ["projects", "academic projects", "personal projects"], 16).slice(0, 12);
  const certifications = extractSectionItems(lines, ["certifications", "certificates", "licenses"], 16).slice(0, 18);
  const educationLines = extractSectionItems(lines, ["education", "academic qualification", "academics"], 8);
  const experienceLines = extractSectionItems(lines, ["experience", "work experience", "professional experience", "employment"], 12);

  return ParsedResumeSchema.parse({
    name: extractName(lines, email, phone),
    email,
    phone,
    location: extractLocation(lines, email, phone),
    experience: extractExperience(text, experienceLines),
    currentCompany: extractCurrentCompany(experienceLines),
    skills: unique(skillsFromSection).slice(0, 40),
    education: educationLines.slice(0, 3).join(" | "),
    projects,
    certifications,
    technologies,
    currentDesignation: extractCurrentDesignation(experienceLines),
    relevantExperience: extractRelevantExperience(text),
    employmentHistory: extractEmploymentHistory(experienceLines),
    educationHistory: educationLines.slice(0, 8),
    tools: extractSectionItems(lines, ["tools", "tools & technologies", "tools and technologies", "software", "platforms"], 20).slice(0, 30),
    languages: extractSectionItems(lines, ["languages", "languages known"], 12)
      .flatMap((line) => splitList(line))
      .slice(0, 12),
    noticePeriod: extractNoticePeriod(text),
  });
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\t]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractName(lines: string[], email: string, phone: string): string {
  const blocked = [email.toLowerCase(), phone.toLowerCase()].filter(Boolean);
  return (
    lines.slice(0, 10).find((line) => {
      const lower = line.toLowerCase();
      if (blocked.some((value) => lower.includes(value))) return false;
      if (/resume|curriculum|vitae|email|phone|linkedin|github|portfolio|http|www\./i.test(line)) return false;
      if (line.length < 3 || line.length > 70) return false;
      return /[a-z]/i.test(line) && !/[{}<>]/.test(line);
    }) ?? ""
  );
}

function extractLocation(lines: string[], email: string, phone: string): string {
  const contactLines = lines.slice(0, 12).filter((line) => !line.includes(email) && !line.includes(phone));
  return contactLines.find((line) => /\b(india|usa|remote|hyderabad|bengaluru|bangalore|chennai|pune|mumbai|delhi|kolkata|vijayawada|andhra|telangana)\b/i.test(line)) ?? "";
}

function extractEmail(text: string): string {
  return text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0] ?? "";
}

function extractPhone(text: string): string {
  return text.match(/(?:\+?\d[\d\s().-]{8,}\d)/)?.[0]?.trim() ?? "";
}

function extractExperience(text: string, experienceLines: string[]): string {
  const direct = text.match(/\b\d+(?:\.\d+)?\+?\s*(?:years?|yrs?)\b(?:\s+of\s+experience)?/i)?.[0];
  if (direct) return direct;
  return experienceLines.find((line) => /\b\d+(?:\.\d+)?\+?\s*(?:years?|yrs?)\b/i.test(line)) ?? "";
}

function extractCurrentCompany(experienceLines: string[]): string {
  const companyLine = experienceLines.find((line) => /\b(?:at|@|company|technologies|software|solutions|systems|labs|pvt|ltd|inc)\b/i.test(line));
  if (!companyLine) return "";
  const atMatch = companyLine.match(/(?:at|@)\s+(.+)$/i)?.[1]?.trim();
  return (atMatch ?? companyLine).replace(/^[-•]\s*/, "").slice(0, 90);
}

const DESIGNATION_HINTS = /\b(engineer|developer|manager|analyst|recruiter|specialist|consultant|architect|designer|lead|head|director|officer|executive|associate|coordinator|administrator|accountant|nurse|doctor|technician|operator|supervisor|assistant|intern|trainee|scientist|researcher|advisor|representative|agent|clerk|planner|strategist|marketer|salesperson|counsel|lawyer|paralegal|therapist|pharmacist|surveyor|inspector|foreman|principal|vp|vice president|cxo|ceo|cto|cfo|coo|chro)\b/i;

function extractCurrentDesignation(experienceLines: string[]): string {
  const line = experienceLines.find((entry) => DESIGNATION_HINTS.test(entry));
  if (!line) return "";
  return line.split(/\bat\b|@|,|—|–|-|\|/i)[0].replace(/^[-•]\s*/, "").trim().slice(0, 80);
}

function extractEmploymentHistory(experienceLines: string[]): string[] {
  return experienceLines
    .filter((line) => DESIGNATION_HINTS.test(line) || /\b(19|20)\d{2}\b/.test(line))
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .slice(0, 12);
}

function extractRelevantExperience(text: string): string {
  return text.match(/relevant\s+experience[:\s-]*([^\n]{2,60})/i)?.[1]?.trim() ?? "";
}

function extractNoticePeriod(text: string): string {
  return (
    text.match(/notice\s*period[:\s-]*([^\n]{2,40})/i)?.[1]?.trim() ??
    text.match(/\b(immediate(?:ly)?\s*(?:available|joiner)?|serving\s*notice|\d{1,3}\s*(?:days?|weeks?|months?)\s*notice)\b/i)?.[0]?.trim() ??
    ""
  );
}

function sectionText(lines: string[], headers: string[], limit: number): string {
  return extractSectionItems(lines, headers, limit).join("\n");
}

function extractSectionItems(lines: string[], headers: string[], limit: number): string[] {
  const start = lines.findIndex((line) => headers.some((header) => isHeader(line, header)));
  if (start === -1) return [];
  const items: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (items.length >= limit) break;
    if (isAnySectionHeader(line) && items.length > 0) break;
    const cleaned = cleanItem(line);
    if (cleaned) items.push(cleaned);
  }
  return items;
}

function isHeader(line: string, header: string): boolean {
  const cleaned = line.toLowerCase().replace(/[:\-–—]/g, "").trim();
  return cleaned === header || cleaned.startsWith(`${header} `);
}

function isAnySectionHeader(line: string): boolean {
  const cleaned = line.toLowerCase().replace(/[:\-–—]/g, "").trim();
  return SECTION_HEADERS.some((header) => cleaned === header);
}

function cleanItem(value: string): string {
  return value.replace(/^[•·▪●○\-*]+\s*/, "").replace(/\s+/g, " ").trim();
}

function splitList(text: string): string[] {
  return unique(
    text
      .split(/[,;|•·▪●○\n]/)
      .map(cleanItem)
      .filter((item) => item.length >= 2 && item.length <= 60),
  );
}

function findKnownTerms(text: string, terms: string[]): string[] {
  return terms.filter((term) => new RegExp(`(^|[^a-z0-9+#.])${escapeRegExp(term)}([^a-z0-9+#.]|$)`, "i").test(text));
}

function mergeParsedResume(aiValue: unknown, local: ParsedResumeData, resumeText: string): ParsedResumeData {
  const source = typeof aiValue === "object" && aiValue !== null ? (aiValue as Record<string, unknown>) : {};
  const scalar = (key: keyof Omit<ParsedResumeData, "skills" | "projects" | "certifications" | "technologies">) => {
    const value = cleanString(source[key]);
    if (!value) return local[key];
    if (key === "experience") return value;
    return appearsInText(resumeText, value) ? value : local[key];
  };
  const list = (key: "skills" | "projects" | "certifications" | "technologies") =>
    unique([...local[key], ...toStringArray(source[key]).filter((item) => appearsInText(resumeText, item))]).slice(0, key === "projects" ? 12 : 40);

  return ParsedResumeSchema.parse({
    name: scalar("name"),
    email: scalar("email") || local.email,
    phone: scalar("phone") || local.phone,
    location: scalar("location"),
    experience: scalar("experience"),
    currentCompany: scalar("currentCompany"),
    skills: list("skills"),
    education: scalar("education"),
    projects: list("projects"),
    certifications: list("certifications"),
    technologies: list("technologies"),
  });
}

function createLocalAnalysis(resumeText: string, jobDescription: string, candidateName?: string): ResumeAnalysis {
  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);
  const parsed = parseResumeLocally(resume);
  const jdTerms = unique([...findKnownTerms(jd, KNOWN_TECHNOLOGIES), ...importantWords(jd)]).slice(0, 30);
  const resumeTerms = unique([...parsed.skills, ...parsed.technologies, ...findKnownTerms(resume, KNOWN_TECHNOLOGIES)]);
  const matchingSkills = jdTerms.filter((term) => appearsInList(resumeTerms, term)).slice(0, 10);
  const missingSkills = jdTerms.filter((term) => !appearsInList(resumeTerms, term)).slice(0, 8);
  const additionalSkills = resumeTerms.filter((term) => !appearsInList(matchingSkills, term)).slice(0, 10);
  const matchRatio = jdTerms.length === 0 ? 0.55 : matchingSkills.length / jdTerms.length;
  const resumeCompleteness = [parsed.email, parsed.phone, parsed.education, parsed.experience, parsed.name].filter(Boolean).length / 5;
  const overallScore = clampScore(42 + matchRatio * 44 + resumeCompleteness * 14);
  const candidate = candidateName || parsed.name || "This candidate";

  return AnalysisSchema.parse({
    overallScore,
    verdict: overallScore >= 80 ? "Strong Match" : overallScore >= 62 ? "Potential Match" : "Needs Review",
    scores: {
      technicalSkills: clampScore(35 + matchRatio * 60),
      experience: clampScore(parsed.experience ? 74 : 58),
      education: clampScore(parsed.education ? 78 : 55),
      communication: clampScore(resume.length > 1800 ? 76 : 64),
      cultureFit: clampScore(62 + matchRatio * 24),
    },
    matchingSkills,
    additionalSkills,
    missingSkills,
    summary: `${candidate} matches ${matchingSkills.length} visible JD signals. Review missing keywords and validate experience depth in interview.`,
    strengths: [
      matchingSkills.length > 0 ? `Relevant skills found: ${matchingSkills.slice(0, 4).join(", ")}.` : "Resume text was extracted successfully for review.",
      parsed.education ? `Education signal found: ${parsed.education}.` : "Profile can be reviewed against the JD text directly.",
      parsed.projects.length > 0 ? "Project details are present in the resume." : "Candidate details are available from the uploaded resume text.",
    ],
    weaknesses: missingSkills.length > 0 ? missingSkills.slice(0, 3).map((skill) => `${skill} is requested in the JD but not clearly visible in the resume.`) : ["No major missing JD keywords were detected by deterministic matching."],
    resumeImprovements: [
      "Add measurable impact for each role or project.",
      missingSkills.length > 0 ? `If accurate, add evidence for: ${missingSkills.slice(0, 3).join(", ")}.` : "Keep key skills grouped for ATS readability.",
      "Keep contact details, skills, education, and experience clearly labeled.",
    ],
    hiringRecommendation: overallScore >= 75 ? "Proceed to recruiter screen and validate depth on matched skills." : "Review manually before shortlisting; focus on missing JD requirements.",
    interviewQuestions: {
      technical: (matchingSkills.length > 0 ? matchingSkills : jdTerms.slice(0, 3)).slice(0, 3).map((skill) => `Walk me through your strongest hands-on work with ${skill}.`),
      hr: ["What type of role are you targeting next?", "Describe a recent challenge and how you handled it.", "What motivates you when working with a new team?"],
      scenario: missingSkills.slice(0, 3).map((skill) => `The role needs ${skill}. How would you ramp up or prove readiness quickly?`),
    },
    scorecard: {
      overallResumeQuality: clampScore(55 + resumeCompleteness * 35),
      atsCompatibility: clampScore(50 + parsed.skills.length * 2 + (parsed.email ? 8 : 0) + (parsed.phone ? 8 : 0)),
      keywordOptimization: clampScore(35 + matchRatio * 60),
      formatting: clampScore(resume.split("\n").length > 8 ? 78 : 62),
      experienceQuality: clampScore(parsed.experience ? 76 : 56),
      education: clampScore(parsed.education ? 78 : 55),
      softSkills: clampScore(64 + matchRatio * 18),
    },
  });
}

function normalizeAnalysis(value: unknown, fallback: ResumeAnalysis): ResumeAnalysis {
  const source = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const scores = typeof source.scores === "object" && source.scores !== null ? (source.scores as Record<string, unknown>) : {};
  const scorecard = typeof source.scorecard === "object" && source.scorecard !== null ? (source.scorecard as Record<string, unknown>) : {};
  const questions = typeof source.interviewQuestions === "object" && source.interviewQuestions !== null ? (source.interviewQuestions as Record<string, unknown>) : {};
  return AnalysisSchema.parse({
    overallScore: clampScore(numberOr(source.overallScore, fallback.overallScore)),
    verdict: cleanString(source.verdict) || fallback.verdict,
    scores: {
      technicalSkills: clampScore(numberOr(scores.technicalSkills, fallback.scores.technicalSkills)),
      experience: clampScore(numberOr(scores.experience, fallback.scores.experience)),
      education: clampScore(numberOr(scores.education, fallback.scores.education)),
      communication: clampScore(numberOr(scores.communication, fallback.scores.communication)),
      cultureFit: clampScore(numberOr(scores.cultureFit, fallback.scores.cultureFit)),
    },
    matchingSkills: toStringArray(source.matchingSkills, fallback.matchingSkills),
    additionalSkills: toStringArray(source.additionalSkills, fallback.additionalSkills),
    missingSkills: toStringArray(source.missingSkills, fallback.missingSkills),
    summary: cleanString(source.summary) || fallback.summary,
    strengths: toStringArray(source.strengths, fallback.strengths),
    weaknesses: toStringArray(source.weaknesses, fallback.weaknesses),
    resumeImprovements: toStringArray(source.resumeImprovements, fallback.resumeImprovements),
    hiringRecommendation: cleanString(source.hiringRecommendation) || fallback.hiringRecommendation,
    interviewQuestions: {
      technical: toStringArray(questions.technical, fallback.interviewQuestions.technical),
      hr: toStringArray(questions.hr, fallback.interviewQuestions.hr),
      scenario: toStringArray(questions.scenario, fallback.interviewQuestions.scenario),
    },
    scorecard: {
      overallResumeQuality: clampScore(numberOr(scorecard.overallResumeQuality, fallback.scorecard.overallResumeQuality)),
      atsCompatibility: clampScore(numberOr(scorecard.atsCompatibility, fallback.scorecard.atsCompatibility)),
      keywordOptimization: clampScore(numberOr(scorecard.keywordOptimization, fallback.scorecard.keywordOptimization)),
      formatting: clampScore(numberOr(scorecard.formatting, fallback.scorecard.formatting)),
      experienceQuality: clampScore(numberOr(scorecard.experienceQuality, fallback.scorecard.experienceQuality)),
      education: clampScore(numberOr(scorecard.education, fallback.scorecard.education)),
      softSkills: clampScore(numberOr(scorecard.softSkills, fallback.scorecard.softSkills)),
    },
  });
}

function parseJsonObject(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return {};
  }
}

function importantWords(text: string): string[] {
  const stop = new Set(["and", "the", "with", "for", "from", "that", "this", "will", "must", "have", "your", "role", "work", "team", "skills", "experience", "years", "candidate", "knowledge"]);
  return unique(
    text
      .split(/[^a-zA-Z0-9+#.]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 3 && !stop.has(word.toLowerCase())),
  ).slice(0, 16);
}

function appearsInList(list: string[], term: string): boolean {
  const needle = simplify(term);
  return list.some((item) => simplify(item) === needle || simplify(item).includes(needle) || needle.includes(simplify(item)));
}

function appearsInText(text: string, value: string): boolean {
  const cleanValue = simplify(value);
  if (!cleanValue) return false;
  return simplify(text).includes(cleanValue);
}

function simplify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function toStringArray(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) return unique(value.map(cleanString).filter(Boolean));
  if (typeof value === "string") return splitList(value);
  return fallback;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.map(cleanItem).filter(Boolean)) {
    const key = simplify(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}