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

import { isCleanSkillToken } from "./token-sanitizer";

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

  // ---------------------------------------------------------------------
  // Salesforce ecosystem
  // ---------------------------------------------------------------------
  "apex": "Apex",
  "apex triggers": "Apex Triggers",
  "triggers": "Apex Triggers",
  "lwc": "Lightning Web Components (LWC)",
  "lightning web components": "Lightning Web Components (LWC)",
  "lightning web component": "Lightning Web Components (LWC)",
  "lightning components": "Aura Components",
  "aura": "Aura Components",
  "aura components": "Aura Components",
  "aura framework": "Aura Components",
  "visualforce": "Visualforce",
  "vf pages": "Visualforce",
  "soql": "SOQL",
  "sosl": "SOSL",
  "sales cloud": "Sales Cloud",
  "service cloud": "Service Cloud",
  "experience cloud": "Experience Cloud",
  "community cloud": "Experience Cloud",
  "communities": "Experience Cloud",
  "marketing cloud": "Marketing Cloud",
  "omnistudio": "OmniStudio",
  "vlocity": "OmniStudio",
  "cpq": "Salesforce CPQ",
  "salesforce cpq": "Salesforce CPQ",
  "mulesoft": "MuleSoft",
  "mule": "MuleSoft",
  "copado": "Copado",
  "flows": "Flows",
  "salesforce flows": "Flows",
  "flow builder": "Flows",
  "validation rules": "Validation Rules",
  "process builder": "Process Builder",
  "sfdc": "Salesforce Platform",
  "salesforce.com": "Salesforce Platform",
  "salesforce platform": "Salesforce Platform",
  "salesforce administration": "Salesforce Administration",
  "sfdc admin": "Salesforce Administration",
  "salesforce admin": "Salesforce Administration",
  "soap api": "SOAP API",
  "soap apis": "SOAP API",
  "soap web service": "SOAP API",
  "soap web services": "SOAP API",
  "bulk api": "Bulk API",
  "vs code": "VS Code",
  "vscode": "VS Code",
  "visual studio code": "VS Code",

  // ---------------------------------------------------------------------
  // SAP / ERP
  // ---------------------------------------------------------------------
  "sap abap": "SAP ABAP",
  "abap": "SAP ABAP",
  "sap fico": "SAP FICO",
  "sap mm": "SAP MM",
  "sap sd": "SAP SD",
  "sap hana": "SAP HANA",
  "s/4hana": "SAP S/4HANA",
  "s4hana": "SAP S/4HANA",
  "sap s4hana": "SAP S/4HANA",
  "oracle erp": "Oracle ERP",
  "netsuite": "NetSuite",
  "dynamics 365": "Dynamics 365",
  "d365": "Dynamics 365",
  "workday": "Workday",
  "servicenow": "ServiceNow",

  // ---------------------------------------------------------------------
  // Data / Analytics / ML
  // ---------------------------------------------------------------------
  "pyspark": "PySpark",
  "apache spark": "Apache Spark",
  "spark": "Apache Spark",
  "hadoop": "Hadoop",
  "airflow": "Apache Airflow",
  "apache airflow": "Apache Airflow",
  "dbt": "dbt",
  "snowflake": "Snowflake",
  "databricks": "Databricks",
  "redshift": "Amazon Redshift",
  "amazon redshift": "Amazon Redshift",
  "bigquery": "BigQuery",
  "google bigquery": "BigQuery",
  "looker": "Looker",
  "qlik": "Qlik",
  "qlikview": "Qlik",
  "qliksense": "Qlik",
  "ssrs": "SSRS",
  "ssis": "SSIS",
  "ssas": "SSAS",
  "xgboost": "XGBoost",
  "hugging face": "Hugging Face",
  "huggingface": "Hugging Face",
  "langchain": "LangChain",
  "llm": "LLM",
  "llms": "LLM",
  "large language models": "LLM",
  "rag": "RAG",
  "retrieval augmented generation": "RAG",
  "vector db": "Vector Database",
  "vector database": "Vector Database",
  "pinecone": "Pinecone",
  "weaviate": "Weaviate",
  "openai": "OpenAI",
  "kafka": "Apache Kafka",
  "apache kafka": "Apache Kafka",
  "data engineering": "Data Engineering",
  "etl": "ETL",
  "elt": "ELT",

  // ---------------------------------------------------------------------
  // Cloud / DevOps additions
  // ---------------------------------------------------------------------
  "ec2": "AWS EC2",
  "s3": "AWS S3",
  "eks": "AWS EKS",
  "ecs": "AWS ECS",
  "lambda": "AWS Lambda",
  "cloudformation": "AWS CloudFormation",
  "argo cd": "Argo CD",
  "argocd": "Argo CD",
  "prometheus": "Prometheus",
  "grafana": "Grafana",
  "datadog": "Datadog",
  "splunk": "Splunk",
  "new relic": "New Relic",
  "github actions": "GitHub Actions",
  "gitlab ci": "GitLab CI",
  "bitbucket pipelines": "Bitbucket Pipelines",
  "ansible": "Ansible",
  "helm": "Helm",
  "istio": "Istio",
  "linux": "Linux",

  // ---------------------------------------------------------------------
  // Mobile
  // ---------------------------------------------------------------------
  "react native": "React Native",
  "flutter": "Flutter",
  "swift": "Swift",
  "swiftui": "SwiftUI",
  "kotlin": "Kotlin",
  "jetpack compose": "Jetpack Compose",
  "ios": "iOS",
  "android": "Android",
  "xamarin": "Xamarin",
  "expo": "Expo",

  // ---------------------------------------------------------------------
  // QA / Testing
  // ---------------------------------------------------------------------
  "cypress": "Cypress",
  "playwright": "Playwright",
  "selenium": "Selenium",
  "selenium webdriver": "Selenium",
  "rest assured": "REST Assured",
  "postman": "Postman",
  "jmeter": "JMeter",
  "appium": "Appium",
  "testng": "TestNG",
  "cucumber": "Cucumber",
  "bdd": "BDD",
  "tdd": "TDD",
  "junit": "JUnit",
  "pytest": "Pytest",
  "jest": "Jest",
  "test automation": "Test Automation",

  // ---------------------------------------------------------------------
  // Security
  // ---------------------------------------------------------------------
  "burp suite": "Burp Suite",
  "burp": "Burp Suite",
  "nessus": "Nessus",
  "wireshark": "Wireshark",
  "siem": "SIEM",
  "splunk es": "Splunk ES",
  "iso 27001": "ISO 27001",
  "soc 2": "SOC 2",
  "gdpr": "GDPR",
  "hipaa": "HIPAA",
  "pci dss": "PCI DSS",
  "owasp": "OWASP",
  "penetration testing": "Penetration Testing",
  "pentesting": "Penetration Testing",

  // ---------------------------------------------------------------------
  // HR / TA / Recruitment additions
  // ---------------------------------------------------------------------
  "naukri": "Naukri",
  "linkedin recruiter": "LinkedIn Recruiter",
  "monster": "Monster",
  "dice": "Dice",
  "hirist": "Hirist",
  "iimjobs": "iimjobs",
  "taleo": "Taleo",
  "greenhouse": "Greenhouse",
  "lever": "Lever",
  "workable": "Workable",
  "smartrecruiters": "SmartRecruiters",
  "icims": "iCIMS",
  "x-ray search": "X-Ray Search",
  "xray search": "X-Ray Search",
  "employee onboarding": "Employee Onboarding",
  "onboarding": "Employee Onboarding",
  "stakeholder management": "Stakeholder Management",
  "offer negotiation": "Offer Negotiation",
  "background verification": "Background Verification",
  "bgv": "Background Verification",

  // ---------------------------------------------------------------------
  // Finance / Accounting
  // ---------------------------------------------------------------------
  "quickbooks": "QuickBooks",
  "tally": "Tally",
  "ifrs": "IFRS",
  "gaap": "GAAP",
  "sox": "SOX",
  "financial modeling": "Financial Modeling",
  "financial modelling": "Financial Modeling",
  "forecasting": "Forecasting",
  "budgeting": "Budgeting",
  "variance analysis": "Variance Analysis",
  "accounts payable": "Accounts Payable",
  "ap": "Accounts Payable",
  "accounts receivable": "Accounts Receivable",
  "ar": "Accounts Receivable",

  // ---------------------------------------------------------------------
  // Sales / Marketing
  // ---------------------------------------------------------------------
  "hubspot": "HubSpot",
  "marketo": "Marketo",
  "pardot": "Pardot",
  "seo": "SEO",
  "sem": "SEM",
  "google ads": "Google Ads",
  "adwords": "Google Ads",
  "meta ads": "Meta Ads",
  "facebook ads": "Meta Ads",
  "ga4": "Google Analytics (GA4)",
  "google analytics": "Google Analytics (GA4)",
  "gtm": "Google Tag Manager",
  "google tag manager": "Google Tag Manager",
  "content marketing": "Content Marketing",
  "lead generation": "Lead Generation",
  "account management": "Account Management",
  "crm": "CRM",

  // ---------------------------------------------------------------------
  // Healthcare / Pharma
  // ---------------------------------------------------------------------
  "emr": "EMR",
  "ehr": "EHR",
  "epic": "Epic",
  "cerner": "Cerner",
  "hl7": "HL7",
  "fhir": "FHIR",
  "clinical trials": "Clinical Trials",
  "regulatory affairs": "Regulatory Affairs",

  // ---------------------------------------------------------------------
  // Mechanical / Manufacturing
  // ---------------------------------------------------------------------
  "autocad": "AutoCAD",
  "solidworks": "SolidWorks",
  "catia": "CATIA",
  "ansys": "ANSYS",
  "plc": "PLC",
  "scada": "SCADA",
  "six sigma": "Six Sigma",
  "lean manufacturing": "Lean Manufacturing",
  "gd&t": "GD&T",

  // ---------------------------------------------------------------------
  // PM / Agile / Common
  // ---------------------------------------------------------------------
  "agile": "Agile",
  "scrum": "Scrum",
  "kanban": "Kanban",
  "safe": "SAFe",
  "jira": "Jira",
  "confluence": "Confluence",
  "product roadmap": "Product Roadmap",
  "user stories": "User Stories",
  "product management": "Product Management",
  "project management": "Project Management",
  "business analysis": "Business Analysis",
  "change management": "Change Management",
  "supply chain": "Supply Chain",
  "talent acquisition": "Talent Acquisition",
  "full stack": "Full Stack Development",
  "full stack development": "Full Stack Development",
  "full-stack": "Full Stack Development",
};

// Sorted alias keys (longest first) used for multi-word phrase extraction.
// Recomputed once at module load — CANONICAL_ALIASES is const.
const ALIAS_KEYS_LONGEST_FIRST = Object.keys(CANONICAL_ALIASES)
  .filter((k) => k.includes(" ") || k.includes(".") || k.includes("-") || k.includes("/"))
  .sort((a, b) => b.length - a.length);

/**
 * Extract known multi-word skill phrases from a raw string before it gets
 * split by delimiters. Returns the matched canonical phrases plus the
 * remaining text with matches removed so downstream splitters can handle
 * the rest. Deterministic longest-match pass.
 */
export function extractSkillPhrases(raw: string): { phrases: string[]; remainder: string } {
  if (!raw) return { phrases: [], remainder: "" };
  let working = ` ${raw.replace(/\s+/g, " ").trim()} `;
  const lowerCache = working.toLowerCase();
  const phrases: string[] = [];
  const consumed: Array<[number, number]> = [];

  for (const key of ALIAS_KEYS_LONGEST_FIRST) {
    const needle = ` ${key} `;
    let searchFrom = 0;
    while (true) {
      const idx = lowerCache.indexOf(needle, searchFrom);
      if (idx === -1) break;
      // Skip if this span overlaps with an already-consumed span.
      const spanStart = idx + 1;
      const spanEnd = idx + needle.length - 1;
      const overlap = consumed.some(([s, e]) => spanStart < e && spanEnd > s);
      if (!overlap) {
        phrases.push(CANONICAL_ALIASES[key]);
        consumed.push([spanStart, spanEnd]);
      }
      searchFrom = idx + needle.length - 1;
    }
  }

  // Build remainder by blanking out consumed spans.
  if (consumed.length > 0) {
    const chars = working.split("");
    for (const [s, e] of consumed) {
      for (let i = s; i < e; i++) chars[i] = " ";
    }
    working = chars.join("");
  }
  return { phrases, remainder: working.replace(/\s+/g, " ").trim() };
}

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
    if (!isCleanSkillToken(trimmedOriginal)) continue;
    const normalized = normalizeSkill(trimmedOriginal);
    if (!normalized) continue;
    if (!isCleanSkillToken(normalized)) continue;
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