// ---------------------------------------------------------------------------
// Skill Normalization Engine
// ---------------------------------------------------------------------------
// Deterministic, reusable service that normalizes skill strings extracted by
// the Resume Parser and the JD Intelligence Engine so downstream services
// (Skill Matching Engine, Candidate Ranking) can compare like-for-like.
//
// This engine NEVER:
//   - compares skills
//   - calculates a match score
//   - calls an AI model
// ---------------------------------------------------------------------------

export interface NormalizedSkill {
  original: string;
  normalized: string;
}

export interface SkillNormalizationInput {
  resume: unknown;
  jd: unknown;
}

export interface SkillNormalizationOutput {
  resumeSkills: NormalizedSkill[];
  jdSkills: NormalizedSkill[];
}

// Fields (across Resume + JD schemas) that may contain skill-like tokens.
const SKILL_FIELDS = [
  "skills",
  "requiredSkills",
  "preferredSkills",
  "mustHaveSkills",
  "goodToHaveSkills",
  "tools",
  "technologies",
  "softSkills",
] as const;

// Canonical alias table. Keys are the lowercased, punctuation-collapsed alias.
// Values are the canonical display form.
const CANONICAL_ALIASES: Record<string, string> = {
  // JavaScript / TypeScript ecosystem
  "reactjs": "React",
  "react js": "React",
  "react.js": "React",
  "react": "React",
  "nodejs": "Node.js",
  "node js": "Node.js",
  "node.js": "Node.js",
  "node": "Node.js",
  "javascript": "JavaScript",
  "java script": "JavaScript",
  "js": "JavaScript",
  "typescript": "TypeScript",
  "type script": "TypeScript",
  "ts": "TypeScript",
  "nextjs": "Next.js",
  "next js": "Next.js",
  "next.js": "Next.js",
  "nestjs": "NestJS",
  "nest js": "NestJS",
  "expressjs": "Express",
  "express js": "Express",
  "express.js": "Express",
  "vuejs": "Vue",
  "vue js": "Vue",
  "vue.js": "Vue",
  "angularjs": "Angular",
  "angular js": "Angular",

  // Java / Spring
  "java": "Java",
  "spring": "Spring",
  "spring framework": "Spring",
  "spring boot": "Spring Boot",
  "spring boot framework": "Spring Boot",
  "springboot": "Spring Boot",

  // Python
  "python": "Python",
  "py": "Python",
  "python3": "Python",

  // APIs
  "rest api": "REST API",
  "rest apis": "REST API",
  "restful api": "REST API",
  "restful apis": "REST API",
  "rest services": "REST API",
  "rest service": "REST API",
  "restful services": "REST API",
  "graphql": "GraphQL",
  "grpc": "gRPC",

  // Cloud
  "aws": "AWS",
  "amazon web services": "AWS",
  "aws ec2": "AWS",
  "aws s3": "AWS",
  "aws lambda": "AWS",
  "azure": "Azure",
  "microsoft azure": "Azure",
  "azure devops": "Azure DevOps",
  "ado": "Azure DevOps",
  "gcp": "GCP",
  "google cloud": "GCP",
  "google cloud platform": "GCP",

  // Databases
  "sql": "SQL",
  "sql server": "SQL",
  "ms sql": "SQL",
  "ms sql server": "SQL",
  "tsql": "SQL",
  "t-sql": "SQL",
  "mysql": "MySQL",
  "mysql database": "MySQL",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "postgre sql": "PostgreSQL",
  "mongo": "MongoDB",
  "mongodb": "MongoDB",
  "mongo db": "MongoDB",
  "oracle": "Oracle",
  "oracle db": "Oracle",

  // DevOps / infra
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "k8s": "Kubernetes",
  "terraform": "Terraform",
  "jenkins": "Jenkins",
  "ci/cd": "CI/CD",
  "ci cd": "CI/CD",
  "cicd": "CI/CD",
  "git": "Git",
  "github": "Git",
  "gitlab": "Git",
  "bitbucket": "Git",

  // Microsoft / BI
  "excel": "Microsoft Excel",
  "ms excel": "Microsoft Excel",
  "microsoft excel": "Microsoft Excel",
  "word": "Microsoft Word",
  "ms word": "Microsoft Word",
  "microsoft word": "Microsoft Word",
  "powerpoint": "Microsoft PowerPoint",
  "ms powerpoint": "Microsoft PowerPoint",
  "power point": "Microsoft PowerPoint",
  "power bi": "Power BI",
  "powerbi": "Power BI",
  "power bi desktop": "Power BI",
  "tableau": "Tableau",

  // Data / ML
  "ml": "Machine Learning",
  "machine learning": "Machine Learning",
  "dl": "Deep Learning",
  "deep learning": "Deep Learning",
  "ai": "Artificial Intelligence",
  "artificial intelligence": "Artificial Intelligence",
  "nlp": "NLP",
  "natural language processing": "NLP",

  // Recruitment / HR domain
  "recruitment": "Recruitment",
  "recruiting": "Recruitment",
  "hiring": "Recruitment",
  "employee hiring": "Recruitment",
  "talent acquisition": "Recruitment",
  "hr recruitment": "Recruitment",
  "technical recruitment": "Recruitment",
  "technical recruiting": "Recruitment",
  "it recruitment": "Recruitment",
  "screening": "Screening",
  "candidate screening": "Screening",
  "resume screening": "Screening",
  "sourcing": "Candidate Sourcing",
  "candidate sourcing": "Candidate Sourcing",
  "talent sourcing": "Candidate Sourcing",
  "boolean search": "Boolean Search",
  "ats": "ATS",
  "applicant tracking system": "ATS",
};

/**
 * Normalize a single skill string. Deterministic and pure.
 * Handles trimming, whitespace collapsing, punctuation smoothing, alias
 * lookup, and capitalization.
 */
export function normalizeSkill(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.replace(/\s+/g, " ").trim().replace(/[.,;:]+$/g, "").trim();
  if (!trimmed) return "";
  const key = trimmed.toLowerCase();
  if (CANONICAL_ALIASES[key]) return CANONICAL_ALIASES[key];
  // Also try a punctuation-smoothed lookup so "React.JS" == "react js".
  const smoothed = key.replace(/[._\-/]+/g, " ").replace(/\s+/g, " ").trim();
  if (CANONICAL_ALIASES[smoothed]) return CANONICAL_ALIASES[smoothed];
  return toTitleCase(trimmed);
}

/**
 * Normalize a list of skills. Preserves originals, deduplicates by normalized
 * form (case-insensitive), and drops empty tokens.
 */
export function normalizeSkillList(values: unknown): NormalizedSkill[] {
  const list = collectStrings(values);
  const seen = new Set<string>();
  const out: NormalizedSkill[] = [];
  for (const original of list) {
    const trimmedOriginal = original.replace(/\s+/g, " ").trim();
    if (!trimmedOriginal) continue;
    const normalized = normalizeSkill(trimmedOriginal);
    if (!normalized) continue;
    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push({ original: trimmedOriginal, normalized });
  }
  return out;
}

/**
 * Main entrypoint. Consumes Resume JSON + JD JSON and returns normalized
 * skill lists for both. Does not compare or score.
 */
export function normalizeSkills(input: SkillNormalizationInput): SkillNormalizationOutput {
  return {
    resumeSkills: normalizeSkillList(collectSkillFields(input.resume)),
    jdSkills: normalizeSkillList(collectSkillFields(input.jd)),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectSkillFields(source: unknown): string[] {
  if (!source || typeof source !== "object") return [];
  const obj = source as Record<string, unknown>;
  const acc: string[] = [];
  for (const field of SKILL_FIELDS) {
    if (field in obj) acc.push(...collectStrings(obj[field]));
  }
  return acc;
}

function collectStrings(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    const out: string[] = [];
    for (const v of value) out.push(...collectStrings(v));
    return out;
  }
  return [];
}

// Preserves already well-cased tokens (e.g. "GraphQL", "PostgreSQL") by only
// title-casing when the input is a single case (all upper OR all lower).
function toTitleCase(value: string): string {
  const isAllLower = value === value.toLowerCase();
  const isAllUpper = value === value.toUpperCase();
  if (!isAllLower && !isAllUpper) return value;
  return value
    .split(/(\s+|[/\-])/)
    .map((part) => {
      if (/^\s+$/.test(part) || part === "/" || part === "-") return part;
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}