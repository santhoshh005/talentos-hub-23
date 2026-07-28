// ---------------------------------------------------------------------------
// Matching Engine
// ---------------------------------------------------------------------------
// Deterministic comparator over the output of the Skill Normalization Engine.
//
// This engine NEVER:
//   - calls an AI model
//   - generates summaries or insights
//   - calculates final hiring scores or recommendations
//
// It ONLY compares normalized Resume skills with normalized JD skills and
// returns structured, sorted, deduplicated data for the future Scoring
// Engine to consume.
// ---------------------------------------------------------------------------

import type { NormalizedSkill } from "./skill-normalizer";

export type ConfidenceKind = "exact" | "alias" | "semantic" | "related";

export interface SkillMatch {
  skill: string;              // canonical normalized value
  resumeOriginal: string;     // preserved original from resume
  jdOriginal: string;         // preserved original from JD
  confidence: 100 | 95 | 90 | 80;
  kind: ConfidenceKind;
}

export interface MatchingSimilarity {
  totalRequiredSkills: number;
  matchedRequiredSkills: number;
  missingRequiredSkills: number;
  totalResumeSkills: number;
  additionalSkills: number;
}

export interface MatchingConfidence {
  averageConfidence: number;
  exactMatches: number;
  aliasMatches: number;
  semanticMatches: number;
  relatedMatches: number;
}

export interface MatchingResult {
  matchingSkills: SkillMatch[];
  missingSkills: string[];
  additionalSkills: string[];
  similarity: MatchingSimilarity;
  confidence: MatchingConfidence;
}

export interface MatchingInput {
  resumeSkills: NormalizedSkill[];
  jdSkills: NormalizedSkill[];
}

// Related-technology adjacency map. Keys and values are canonical normalized
// skill names (matching the Skill Normalization Engine's output). Symmetry is
// applied at lookup time so each edge only needs to be declared once.
const RELATED_TECHNOLOGIES: Record<string, string[]> = {
  React: ["Next.js", "Redux"],
  "Next.js": ["React"],
  "Node.js": ["Express", "NestJS"],
  Express: ["Node.js"],
  NestJS: ["Node.js"],
  JavaScript: ["TypeScript"],
  TypeScript: ["JavaScript"],
  Java: ["Spring", "Spring Boot"],
  Spring: ["Spring Boot", "Java"],
  "Spring Boot": ["Spring", "Java"],
  AWS: ["Terraform", "Docker", "Kubernetes"],
  Azure: ["Azure DevOps"],
  GCP: ["Kubernetes"],
  Docker: ["Kubernetes"],
  Kubernetes: ["Docker", "Terraform"],
  SQL: ["MySQL", "PostgreSQL"],
  MySQL: ["SQL"],
  PostgreSQL: ["SQL"],
  MongoDB: ["NoSQL"],
  "Machine Learning": ["Python", "Deep Learning"],
  "Deep Learning": ["Machine Learning"],
  NLP: ["Machine Learning"],
  Recruitment: ["Screening", "Candidate Sourcing"],
  Screening: ["Recruitment"],
  "Candidate Sourcing": ["Recruitment", "Boolean Search"],
  "Boolean Search": ["Candidate Sourcing"],

  // Salesforce ontology
  "Salesforce Platform": [
    "Apex", "Apex Triggers", "Lightning Web Components (LWC)", "Aura Components",
    "Visualforce", "SOQL", "SOSL", "Sales Cloud", "Service Cloud",
    "Experience Cloud", "Flows", "Validation Rules", "Salesforce Administration",
  ],
  Apex: ["Apex Triggers", "SOQL", "Salesforce Platform"],
  "Apex Triggers": ["Apex"],
  "Lightning Web Components (LWC)": ["Aura Components", "Visualforce", "Salesforce Platform"],
  "Aura Components": ["Lightning Web Components (LWC)", "Visualforce"],
  Visualforce: ["Lightning Web Components (LWC)", "Aura Components"],
  SOQL: ["Apex", "SOSL"],
  SOSL: ["SOQL"],
  "Sales Cloud": ["Salesforce Platform", "Service Cloud"],
  "Service Cloud": ["Salesforce Platform", "Sales Cloud"],
  "Experience Cloud": ["Salesforce Platform"],
  "Marketing Cloud": ["Salesforce Platform"],
  OmniStudio: ["Salesforce Platform"],
  "Salesforce CPQ": ["Salesforce Platform"],
  MuleSoft: ["REST API", "SOAP API"],
  Copado: ["CI/CD", "Git"],
  Flows: ["Salesforce Platform", "Process Builder"],
  "Validation Rules": ["Salesforce Platform"],
  "Salesforce Administration": ["Salesforce Platform"],

  // API family
  "REST API": ["GraphQL", "gRPC", "SOAP API"],
  "SOAP API": ["REST API"],
  GraphQL: ["REST API"],
  gRPC: ["REST API"],

  // Mobile
  Android: ["Kotlin", "Java", "Jetpack Compose"],
  iOS: ["Swift", "SwiftUI"],
  Kotlin: ["Android", "Java"],
  Swift: ["iOS", "SwiftUI"],
  "React Native": ["React", "iOS", "Android"],
  Flutter: ["iOS", "Android"],

  // SAP
  SAP: ["SAP ABAP", "SAP FICO", "SAP MM", "SAP SD", "SAP HANA"],
  "SAP ABAP": ["SAP"],
  "SAP FICO": ["SAP"],
  "SAP MM": ["SAP"],
  "SAP SD": ["SAP"],
  "SAP HANA": ["SAP", "SAP S/4HANA"],
  "SAP S/4HANA": ["SAP HANA", "SAP"],

  // Data ecosystem
  "Data Engineering": ["Apache Spark", "Apache Airflow", "dbt", "Snowflake", "Databricks", "ETL"],
  "Apache Spark": ["PySpark", "Databricks", "Hadoop"],
  PySpark: ["Apache Spark", "Python"],
  "Apache Airflow": ["ETL", "Data Engineering"],
  Snowflake: ["SQL", "Data Engineering"],
  Databricks: ["Apache Spark", "Data Engineering"],
  "Apache Kafka": ["Data Engineering"],
  ETL: ["ELT", "Data Engineering"],
  BigQuery: ["SQL", "GCP"],
  "Amazon Redshift": ["SQL", "AWS"],
  "Power BI": ["Data Analytics", "Tableau"],
  Tableau: ["Data Analytics", "Power BI"],

  // ML/AI
  LLM: ["LangChain", "RAG", "OpenAI", "Hugging Face"],
  LangChain: ["LLM", "RAG"],
  RAG: ["LLM", "Vector Database"],
  "Hugging Face": ["LLM"],
  OpenAI: ["LLM"],
  TensorFlow: ["Machine Learning", "Deep Learning"],
  PyTorch: ["Machine Learning", "Deep Learning"],

  // DevOps
  "CI/CD": ["Jenkins", "GitHub Actions", "GitLab CI", "Copado", "Argo CD"],
  Jenkins: ["CI/CD"],
  "GitHub Actions": ["CI/CD"],
  "GitLab CI": ["CI/CD"],
  "Argo CD": ["CI/CD", "Kubernetes"],
  Terraform: ["AWS", "Azure", "GCP"],
  Helm: ["Kubernetes"],

  // Recruitment / ATS
  ATS: ["Greenhouse", "Lever", "Workday", "Taleo", "iCIMS"],
  Greenhouse: ["ATS"],
  Lever: ["ATS"],
  Taleo: ["ATS"],
  iCIMS: ["ATS"],
  "LinkedIn Recruiter": ["Candidate Sourcing", "Boolean Search"],
  Naukri: ["Candidate Sourcing"],

  // Product / Agile
  "Product Management": ["Agile", "Scrum", "Jira", "Product Roadmap"],
  Agile: ["Scrum", "Kanban", "SAFe"],
  Scrum: ["Agile", "Jira"],
  Jira: ["Agile", "Confluence"],

  // Finance
  "Financial Modeling": ["Forecasting", "Budgeting", "Variance Analysis"],
  QuickBooks: ["Accounts Payable", "Accounts Receivable"],

  // Marketing
  SEO: ["SEM", "Content Marketing", "Google Analytics (GA4)"],
  SEM: ["Google Ads", "SEO"],
  HubSpot: ["CRM", "Marketo"],

  // Testing
  Selenium: ["Cypress", "Playwright", "TestNG"],
  Cypress: ["Playwright", "Test Automation"],
  Playwright: ["Cypress", "Test Automation"],
};

/**
 * Compare normalized Resume skills against normalized JD skills. Deterministic,
 * pure, and free of any AI calls or scoring logic.
 */
export function matchSkills(input: MatchingInput): MatchingResult {
  const resume = dedupeByNormalized(input.resumeSkills ?? []);
  const jd = dedupeByNormalized(input.jdSkills ?? []);

  const resumeByNorm = new Map(resume.map((s) => [s.normalized.toLowerCase(), s]));
  const jdByNorm = new Map(jd.map((s) => [s.normalized.toLowerCase(), s]));

  const matchingSkills: SkillMatch[] = [];
  const matchedJdKeys = new Set<string>();

  // Pass 1: exact and alias matches on normalized value.
  for (const [key, jdSkill] of jdByNorm) {
    const resumeSkill = resumeByNorm.get(key);
    if (!resumeSkill) continue;
    const resumeOriginalKey = resumeSkill.original.toLowerCase().replace(/\s+/g, " ").trim();
    const jdOriginalKey = jdSkill.original.toLowerCase().replace(/\s+/g, " ").trim();
    const isExact = resumeOriginalKey === jdOriginalKey;
    matchingSkills.push({
      skill: jdSkill.normalized,
      resumeOriginal: resumeSkill.original,
      jdOriginal: jdSkill.original,
      confidence: isExact ? 100 : 95,
      kind: isExact ? "exact" : "alias",
    });
    matchedJdKeys.add(key);
  }

  // Pass 2: related-technology matches for JD skills still unmatched.
  for (const [key, jdSkill] of jdByNorm) {
    if (matchedJdKeys.has(key)) continue;
    const related = RELATED_TECHNOLOGIES[jdSkill.normalized] ?? [];
    for (const candidate of related) {
      const candidateKey = candidate.toLowerCase();
      const resumeSkill = resumeByNorm.get(candidateKey);
      if (!resumeSkill) continue;
      matchingSkills.push({
        skill: jdSkill.normalized,
        resumeOriginal: resumeSkill.original,
        jdOriginal: jdSkill.original,
        confidence: 80,
        kind: "related",
      });
      matchedJdKeys.add(key);
      break;
    }
  }

  matchingSkills.sort((a, b) => a.skill.localeCompare(b.skill, undefined, { sensitivity: "base" }));

  const missingSkills = uniqueSorted(
    Array.from(jdByNorm.values())
      .filter((s) => !matchedJdKeys.has(s.normalized.toLowerCase()))
      .map((s) => s.normalized),
  );

  const matchedResumeKeys = new Set(matchingSkills.map((m) => m.skill.toLowerCase()));
  const additionalSkills = uniqueSorted(
    Array.from(resumeByNorm.values())
      .filter((s) => !matchedResumeKeys.has(s.normalized.toLowerCase()))
      .map((s) => s.normalized),
  );

  const totalRequiredSkills = jdByNorm.size;
  const matchedRequiredSkills = matchingSkills.length;
  const missingRequiredSkills = missingSkills.length;
  const totalResumeSkills = resumeByNorm.size;

  const similarity: MatchingSimilarity = {
    totalRequiredSkills,
    matchedRequiredSkills,
    missingRequiredSkills,
    totalResumeSkills,
    additionalSkills: additionalSkills.length,
  };

  const confidence: MatchingConfidence = {
    averageConfidence: matchingSkills.length
      ? Math.round(
          matchingSkills.reduce((sum, m) => sum + m.confidence, 0) / matchingSkills.length,
        )
      : 0,
    exactMatches: matchingSkills.filter((m) => m.kind === "exact").length,
    aliasMatches: matchingSkills.filter((m) => m.kind === "alias").length,
    semanticMatches: matchingSkills.filter((m) => m.kind === "semantic").length,
    relatedMatches: matchingSkills.filter((m) => m.kind === "related").length,
  };

  return { matchingSkills, missingSkills, additionalSkills, similarity, confidence };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dedupeByNormalized(list: NormalizedSkill[]): NormalizedSkill[] {
  const seen = new Set<string>();
  const out: NormalizedSkill[] = [];
  for (const item of list) {
    if (!item || !item.normalized) continue;
    const key = item.normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function uniqueSorted(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}