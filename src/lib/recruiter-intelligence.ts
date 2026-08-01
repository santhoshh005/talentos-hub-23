// ---------------------------------------------------------------------------
// Recruiter Intelligence Engine
// ---------------------------------------------------------------------------
// Deterministic recruiter-grade narrative: summary, strengths, risks,
// grouped missing skills, inferred domain & seniority. NEVER calls AI —
// downstream services can enrich wording later.
// ---------------------------------------------------------------------------

import type { ParsedResumeData } from "./resume-analyzer.server";
import type { JdIntelligence } from "./jd-intelligence.server";
import type { MatchingResult } from "./matching-engine";
import type { SkillEvidence } from "./evidence-engine";
import type { ScoringResult } from "./scoring-engine";
import { extractYearsFromExperience, seniorityFromYears } from "./token-sanitizer";
import type { ParsedJDV3, ParsedResumeV3 } from "./intelligence-schemas";

type SkillCategory =
  | "Frontend"
  | "Backend"
  | "Cloud"
  | "DevOps"
  | "Data"
  | "AI/ML"
  | "Database"
  | "Mobile"
  | "Security"
  | "QA"
  | "Recruitment"
  | "Other";

interface GroupedSkills {
  category: SkillCategory;
  skills: string[];
}

export interface RecruiterIntelligence {
  inferredDomain: string;
  inferredSeniority: string;
  candidateYears: number;
  requiredYears: { min: number; max: number } | null;
  seniorityAlignment: "Aligned" | "Under" | "Over" | "Unknown";
  recommendation: {
    label: "Highly Recommended" | "Recommended" | "Needs Review" | "Low Match";
    tone: "emerald" | "sky" | "amber" | "rose";
    description: string;
  };
  summary: string;
  strengths: string[];
  risks: string[];
  missingByCategory: GroupedSkills[];
  aiFitSummary?: string;
  aiInterviewQuestions?: string[];
}

// ---------------------------------------------------------------------------

const CATEGORY_RULES: Array<{ category: SkillCategory; match: RegExp }> = [
  {
    category: "Frontend",
    match: /^(react|next\.js|vue|angular|svelte|html|css|tailwind|redux|typescript|javascript)$/i,
  },
  {
    category: "Backend",
    match:
      /^(node\.js|express|nestjs|java|spring|spring boot|python|django|flask|go|golang|ruby|rails|\.net|c#|php|laravel|rest api|graphql|grpc)$/i,
  },
  { category: "Cloud", match: /^(aws|azure|gcp|cloudflare|vercel|netlify)$/i },
  {
    category: "DevOps",
    match:
      /^(docker|kubernetes|terraform|jenkins|ci\/cd|github actions|ansible|helm|git|azure devops)$/i,
  },
  {
    category: "Database",
    match: /^(sql|mysql|postgresql|mongodb|oracle|redis|dynamodb|cassandra|snowflake|bigquery)$/i,
  },
  {
    category: "Data",
    match: /^(power bi|tableau|excel|microsoft excel|spark|hadoop|kafka|airflow|dbt|etl)$/i,
  },
  {
    category: "AI/ML",
    match:
      /^(machine learning|deep learning|artificial intelligence|nlp|tensorflow|pytorch|scikit-learn|pandas|numpy|langchain|openai)$/i,
  },
  { category: "Mobile", match: /^(react native|flutter|swift|kotlin|ios|android)$/i },
  { category: "Security", match: /^(oauth|jwt|owasp|penetration testing|iam|encryption)$/i },
  { category: "QA", match: /^(selenium|cypress|playwright|jest|junit|pytest|test automation)$/i },
  {
    category: "Recruitment",
    match: /^(recruitment|screening|candidate sourcing|boolean search|ats)$/i,
  },
];

function categorize(skill: string): SkillCategory {
  for (const rule of CATEGORY_RULES) if (rule.match.test(skill)) return rule.category;
  return "Other";
}

function groupByCategory(skills: string[]): GroupedSkills[] {
  const buckets = new Map<SkillCategory, string[]>();
  for (const s of skills) {
    const c = categorize(s);
    if (!buckets.has(c)) buckets.set(c, []);
    buckets.get(c)!.push(s);
  }
  return Array.from(buckets.entries())
    .map(([category, arr]) => ({ category, skills: arr.sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

// ---------------------------------------------------------------------------

const DOMAIN_RULES: Array<{ domain: string; match: RegExp }> = [
  {
    domain: "Salesforce CRM",
    match:
      /\b(salesforce|sfdc|apex|lightning web|visualforce|soql|sosl|sales cloud|service cloud|experience cloud|omnistudio|cpq|mulesoft|lwc)\b/i,
  },
  {
    domain: "SAP / ERP",
    match:
      /\b(sap abap|sap fico|sap mm|sap sd|sap hana|s\/?4hana|oracle erp|netsuite|dynamics 365|workday|servicenow)\b/i,
  },
  {
    domain: "Data Engineering",
    match:
      /\b(spark|pyspark|hadoop|airflow|dbt|snowflake|databricks|redshift|bigquery|kafka|data engineer)\b/i,
  },
  {
    domain: "AI / Machine Learning",
    match: /\b(ai|ml|machine learning|deep learning|nlp|data scien|llm)\b/i,
  },
  {
    domain: "Data & Analytics",
    match: /\b(data analyst|data engineer|analytics|bi|business intelligence|reporting)\b/i,
  },
  {
    domain: "Cloud & DevOps",
    match: /\b(devops|sre|cloud|infrastructure|platform engineer|kubernetes|terraform|argo cd)\b/i,
  },
  {
    domain: "Cybersecurity",
    match: /\b(security|infosec|penetration|soc analyst|siem|owasp|burp|nessus|pentest)\b/i,
  },
  {
    domain: "Talent Acquisition",
    match:
      /\b(recruiter|recruitment|talent acquisition|sourcing|boolean|greenhouse|lever|naukri)\b/i,
  },
  { domain: "Product Management", match: /\b(product manager|product owner|product roadmap)\b/i },
  {
    domain: "Mobile Engineering",
    match: /\b(mobile|ios|android|react native|flutter|swiftui|jetpack compose)\b/i,
  },
  {
    domain: "Backend Engineering",
    match: /\b(backend|back-end|server|api|microservices|java developer|python developer|node)\b/i,
  },
  {
    domain: "Frontend Engineering",
    match: /\b(frontend|front-end|ui developer|react|angular|vue)\b/i,
  },
  { domain: "Full-Stack Engineering", match: /\b(full[\s-]?stack|mern|mean)\b/i },
  {
    domain: "Marketing",
    match: /\b(seo|sem|google ads|hubspot|marketo|content marketing|lead generation)\b/i,
  },
  {
    domain: "Finance / Accounting",
    match:
      /\b(financial analyst|accountant|controller|quickbooks|ifrs|gaap|sox|financial modeling|accounts payable|accounts receivable)\b/i,
  },
  { domain: "Fintech / Banking", match: /\b(fintech|banking|payments|trading)\b/i },
  { domain: "Healthcare", match: /\b(healthcare|medical|clinical|pharma)\b/i },
  { domain: "E-commerce / Retail", match: /\b(ecommerce|e-commerce|retail|shopify)\b/i },
  {
    domain: "Manufacturing",
    match: /\b(autocad|solidworks|catia|plc|scada|six sigma|lean manufacturing)\b/i,
  },
];

function inferDomain(jd: JdIntelligence, resume: ParsedResumeData): string {
  if (jd.domain && jd.domain !== "Not Found") return jd.domain;
  const parts: string[] = [
    jd.jobTitle,
    jd.industry,
    jd.department,
    resume.currentDesignation,
    ...(jd.requiredSkills ?? []).slice(0, 20),
    ...(jd.preferredSkills ?? []).slice(0, 10),
    ...(jd.technologies ?? []).slice(0, 10),
    ...(resume.skills ?? []).slice(0, 20),
    ...(resume.technologies ?? []).slice(0, 10),
  ].filter((v): v is string => Boolean(v) && v !== "Not Found");
  const haystack = parts.join(" ");
  for (const rule of DOMAIN_RULES) if (rule.match.test(haystack)) return rule.domain;
  return jd.jobTitle && jd.jobTitle !== "Not Found" ? jd.jobTitle : "General";
}

function parseRequiredYears(text: string): { min: number; max: number } | null {
  if (!text) return null;
  const range = text.match(/(\d+(?:\.\d+)?)\s*[-–to]{1,3}\s*(\d+(?:\.\d+)?)/);
  if (range) return { min: parseFloat(range[1]), max: parseFloat(range[2]) };
  const single = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i);
  if (single) {
    const n = parseFloat(single[1]);
    return { min: n, max: n + 3 };
  }
  return null;
}

function computeAlignment(
  candidateYears: number,
  required: { min: number; max: number } | null,
): RecruiterIntelligence["seniorityAlignment"] {
  if (!required || candidateYears <= 0) return "Unknown";
  if (candidateYears < required.min - 0.5) return "Under";
  if (candidateYears > required.max + 2) return "Over";
  return "Aligned";
}

function recommendationFor(pct: number): RecruiterIntelligence["recommendation"] {
  if (pct >= 80)
    return {
      label: "Highly Recommended",
      tone: "emerald",
      description: "Strong alignment across required skills and evidence.",
    };
  if (pct >= 65)
    return {
      label: "Recommended",
      tone: "sky",
      description: "Solid fit with minor gaps — validate in interview.",
    };
  if (pct >= 45)
    return {
      label: "Needs Review",
      tone: "amber",
      description: "Partial alignment — recruiter judgement recommended.",
    };
  return {
    label: "Low Match",
    tone: "rose",
    description: "Significant gaps against the role's core requirements.",
  };
}

export interface RecruiterIntelligenceInput {
  resume: ParsedResumeData;
  jd: JdIntelligence;
  matching: MatchingResult;
  evidence: SkillEvidence[];
  scoring: ScoringResult;
  resumeV3?: ParsedResumeV3;
  jdV3?: ParsedJDV3;
}

export function buildRecruiterIntelligence(
  input: RecruiterIntelligenceInput,
): RecruiterIntelligence {
  const { resume, jd, matching, evidence, scoring, resumeV3, jdV3 } = input;

  const candidateYears =
    resumeV3 && resumeV3.totalYears > 0
      ? resumeV3.totalYears
      : extractYearsFromExperience(resume.experience);
  const requiredYears =
    jdV3 && (jdV3.minYears > 0 || jdV3.maxYears > 0)
      ? { min: jdV3.minYears || jdV3.maxYears, max: jdV3.maxYears || jdV3.minYears + 3 }
      : parseRequiredYears(jd.experienceRequired);
  const alignment = computeAlignment(candidateYears, requiredYears);
  const inferredSeniorityCandidate =
    (resumeV3?.inferredSeniority && resumeV3.inferredSeniority.trim()) ||
    seniorityFromYears(candidateYears);
  const inferredDomain =
    (jdV3?.domain && jdV3.domain.trim()) ||
    (resumeV3?.inferredDomain && resumeV3.inferredDomain.trim()) ||
    inferDomain(jd, resume);

  const recommendation = recommendationFor(scoring.matchPercentage);
  const missingByCategory = groupByCategory(matching.missingSkills);

  // Strengths: high-confidence matched skills with strong evidence
  const evidenceByKey = new Map(evidence.map((e) => [e.skill.toLowerCase(), e]));
  const strongMatches = matching.matchingSkills
    .map((m) => ({ ...m, ev: evidenceByKey.get(m.skill.toLowerCase())?.evidenceStrength ?? 0 }))
    .sort((a, b) => b.ev + b.confidence - (a.ev + a.confidence));

  const strengths: string[] = [];
  if (resumeV3?.strengths && resumeV3.strengths.length > 0) {
    strengths.push(...resumeV3.strengths.slice(0, 6));
  }
  if (candidateYears > 0 && !strengths.some((s) => /years/i.test(s))) {
    strengths.push(
      `${candidateYears} years of overall experience — profile trends ${inferredSeniorityCandidate}.`,
    );
  }
  const topSkills = strongMatches.slice(0, 5).map((m) => m.skill);
  if (topSkills.length && strengths.length < 6) {
    strengths.push(`Core skill overlap: ${topSkills.join(", ")}.`);
  }
  const evidencedSkills = strongMatches
    .filter((m) => m.ev >= 60)
    .map((m) => m.skill)
    .slice(0, 4);
  if (evidencedSkills.length && strengths.length < 6) {
    strengths.push(`Deep evidence for ${evidencedSkills.join(", ")} across resume sections.`);
  }
  if (alignment === "Aligned" && strengths.length < 6) {
    strengths.push(`Experience aligns with the JD's ${jd.experienceRequired} requirement.`);
  }
  if (resume.certifications && resume.certifications.length > 0 && strengths.length < 6) {
    strengths.push(
      `Holds ${resume.certifications.length} relevant certification${resume.certifications.length === 1 ? "" : "s"}.`,
    );
  }

  const risks: string[] = [];
  if (resumeV3?.risks && resumeV3.risks.length > 0) {
    risks.push(...resumeV3.risks.slice(0, 4));
  }
  if (matching.missingSkills.length > 0) {
    const topMissing = matching.missingSkills.slice(0, 5).join(", ");
    risks.push(
      `Missing ${matching.missingSkills.length} required skill${matching.missingSkills.length === 1 ? "" : "s"}: ${topMissing}${matching.missingSkills.length > 5 ? "…" : ""}.`,
    );
  }
  if (alignment === "Under" && requiredYears) {
    risks.push(
      `Under the JD's minimum experience (${requiredYears.min}+ years) — candidate has ${candidateYears} years.`,
    );
  }
  if (alignment === "Over" && requiredYears) {
    risks.push(
      `Overqualified vs the JD's expected range (${requiredYears.min}-${requiredYears.max} years).`,
    );
  }
  const weakEvidence = strongMatches
    .filter((m) => m.ev > 0 && m.ev < 40)
    .map((m) => m.skill)
    .slice(0, 4);
  if (weakEvidence.length) {
    risks.push(`Thin evidence for ${weakEvidence.join(", ")} — probe depth in interview.`);
  }
  if (resume.noticePeriod && /^\d+\s*months?/i.test(resume.noticePeriod)) {
    risks.push(`Notice period is ${resume.noticePeriod} — plan pipeline accordingly.`);
  }
  if (risks.length === 0) risks.push("No material risks detected from deterministic signals.");

  const seniorityLabel =
    jd.seniorityLevel && jd.seniorityLevel !== "Not Found"
      ? jd.seniorityLevel
      : inferredSeniorityCandidate;

  const llmSummary = resumeV3?.summary?.trim();
  const summary = llmSummary
    ? `${llmSummary} Skill coverage ${scoring.skillCoverage}% (${matching.similarity.matchedRequiredSkills}/${matching.similarity.totalRequiredSkills}), evidence ${scoring.evidenceScore}%, overall match ${scoring.matchPercentage}% — ${recommendation.label.toLowerCase()}.`
    : [
        `${resume.name} is a ${resume.currentDesignation} at ${resume.currentCompany}`,
        candidateYears > 0
          ? `with ${candidateYears} years of experience`
          : "with unspecified tenure",
        `applying for a ${seniorityLabel} ${inferredDomain} role.`,
        `Skill coverage: ${scoring.skillCoverage}% (${matching.similarity.matchedRequiredSkills}/${matching.similarity.totalRequiredSkills} required), evidence strength: ${scoring.evidenceScore}%.`,
        `Overall match ${scoring.matchPercentage}% — ${recommendation.label.toLowerCase()}.`,
      ].join(" ");

  return {
    inferredDomain,
    inferredSeniority: seniorityLabel,
    candidateYears,
    requiredYears,
    seniorityAlignment: alignment,
    recommendation,
    summary,
    strengths,
    risks,
    missingByCategory,
  };
}
