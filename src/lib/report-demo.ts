import type { PipelineResult } from "./pipeline.functions";

// Deterministic demo pipeline output so the Recruiter Intelligence Report
// route is viewable without running the full pipeline. Consumes only the
// existing pipeline shape — no backend, scoring, or business logic here.
export const demoPipelineResult: PipelineResult = {
  ok: true,
  resume: {
    name: "Aarav Menon",
    email: "aarav.menon@example.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    experience: "6 years",
    currentCompany: "Zenlytic Labs",
    currentDesignation: "Senior Full Stack Engineer",
    relevantExperience: "5.5 years",
    skills: [
      "React", "TypeScript", "Node.js", "Spring Boot", "AWS",
      "Docker", "PostgreSQL", "REST API", "GraphQL",
    ],
    technologies: ["Kafka", "Redis", "Kubernetes"],
    tools: ["Git", "Jira", "Figma", "Datadog"],
    languages: ["English", "Hindi"],
    education: "B.Tech, Computer Science — NIT Trichy",
    educationHistory: [
      "B.Tech Computer Science, NIT Trichy (2016 - 2020)",
    ],
    employmentHistory: [
      "Zenlytic Labs — Senior Full Stack Engineer (2022 - Present)",
      "Fintrail Systems — Full Stack Engineer (2020 - 2022)",
    ],
    projects: [
      "Realtime pricing engine on Kafka + Spring Boot handling 50k msg/sec.",
      "Design system in React + TypeScript adopted across 8 product surfaces.",
      "Zero-downtime PostgreSQL sharding migration on AWS.",
    ],
    certifications: [
      "AWS Certified Solutions Architect — Associate",
      "MongoDB Developer Associate",
    ],
    noticePeriod: "30 days",
  },
  jobDescription: {
    jobTitle: "Senior Full Stack Engineer",
    industry: "SaaS",
    department: "Engineering",
    employmentType: "Full-time",
    experienceRequired: "5-8 years",
    educationRequired: ["Bachelor's degree in Computer Science or related"],
    requiredSkills: [
      "React", "TypeScript", "Node.js", "AWS", "Docker",
      "PostgreSQL", "REST API", "Kafka", "Terraform",
    ],
    preferredSkills: ["GraphQL", "Kubernetes", "Redis"],
    responsibilities: [
      "Own end-to-end delivery of customer-facing product surfaces.",
      "Design distributed backend services for high-throughput workloads.",
      "Mentor mid-level engineers and raise the engineering bar.",
    ],
    tools: ["Git", "Jira", "Datadog"],
    technologies: ["Kafka", "Redis"],
    softSkills: ["Ownership", "Communication", "Mentorship"],
    certifications: ["AWS certifications preferred"],
    domain: "B2B SaaS Platforms",
    seniorityLevel: "Senior",
  },
  normalizedSkills: {
    resumeSkills: [],
    jdSkills: [],
  },
  matching: {
    matchingSkills: [
      { skill: "React", resumeOriginal: "React", jdOriginal: "React", confidence: 100, kind: "exact" },
      { skill: "TypeScript", resumeOriginal: "TypeScript", jdOriginal: "TypeScript", confidence: 100, kind: "exact" },
      { skill: "Node.js", resumeOriginal: "Node.js", jdOriginal: "Node.js", confidence: 100, kind: "exact" },
      { skill: "AWS", resumeOriginal: "AWS", jdOriginal: "AWS", confidence: 100, kind: "exact" },
      { skill: "Docker", resumeOriginal: "Docker", jdOriginal: "Docker", confidence: 100, kind: "exact" },
      { skill: "PostgreSQL", resumeOriginal: "PostgreSQL", jdOriginal: "PostgreSQL", confidence: 100, kind: "exact" },
      { skill: "REST API", resumeOriginal: "REST API", jdOriginal: "REST API", confidence: 100, kind: "exact" },
      { skill: "Kafka", resumeOriginal: "Kafka", jdOriginal: "Kafka", confidence: 80, kind: "related" },
      { skill: "Kubernetes", resumeOriginal: "Kubernetes", jdOriginal: "Kubernetes", confidence: 100, kind: "exact" },
      { skill: "Redis", resumeOriginal: "Redis", jdOriginal: "Redis", confidence: 100, kind: "exact" },
      { skill: "GraphQL", resumeOriginal: "GraphQL", jdOriginal: "GraphQL", confidence: 100, kind: "exact" },
    ],
    missingSkills: ["Terraform"],
    additionalSkills: ["Spring Boot"],
    similarity: {
      totalRequiredSkills: 9,
      matchedRequiredSkills: 8,
      missingRequiredSkills: 1,
      totalResumeSkills: 12,
      additionalSkills: 1,
    },
    confidence: {
      averageConfidence: 98,
      exactMatches: 10,
      aliasMatches: 0,
      semanticMatches: 0,
      relatedMatches: 1,
    },
  },
  evidence: [
    { skill: "React", evidenceStrength: 96, foundIn: ["Skills", "Projects", "Employment History"], occurrenceCount: 6, yearsReferenced: 5.5 },
    { skill: "TypeScript", evidenceStrength: 92, foundIn: ["Skills", "Projects"], occurrenceCount: 4, yearsReferenced: 4 },
    { skill: "Node.js", evidenceStrength: 88, foundIn: ["Skills", "Employment History"], occurrenceCount: 3, yearsReferenced: 4 },
    { skill: "AWS", evidenceStrength: 90, foundIn: ["Skills", "Projects", "Certifications"], occurrenceCount: 4, yearsReferenced: 3.5 },
    { skill: "Docker", evidenceStrength: 74, foundIn: ["Skills"], occurrenceCount: 2, yearsReferenced: 2 },
    { skill: "PostgreSQL", evidenceStrength: 82, foundIn: ["Skills", "Projects"], occurrenceCount: 3, yearsReferenced: 3 },
    { skill: "REST API", evidenceStrength: 70, foundIn: ["Skills"], occurrenceCount: 2, yearsReferenced: 2.5 },
    { skill: "Kafka", evidenceStrength: 85, foundIn: ["Projects", "Skills"], occurrenceCount: 2, yearsReferenced: 2 },
    { skill: "Kubernetes", evidenceStrength: 60, foundIn: ["Skills"], occurrenceCount: 1, yearsReferenced: 1.5 },
    { skill: "Redis", evidenceStrength: 55, foundIn: ["Skills"], occurrenceCount: 1, yearsReferenced: 1 },
    { skill: "GraphQL", evidenceStrength: 50, foundIn: ["Skills"], occurrenceCount: 1, yearsReferenced: 1 },
  ],
  metadata: {
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    totalDurationMs: 1842.5,
    version: "1.0.0",
    stages: [
      { stage: "resumeParser", durationMs: 812.3, ok: true },
      { stage: "jdIntelligence", durationMs: 604.1, ok: true },
      { stage: "skillNormalization", durationMs: 3.2, ok: true },
      { stage: "matching", durationMs: 1.8, ok: true },
      { stage: "evidence", durationMs: 2.6, ok: true },
    ],
  },
};

export function getReportData(): PipelineResult {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem("talentos.pipeline.result");
      if (raw) {
        const parsed = JSON.parse(raw) as PipelineResult;
        if (parsed && (parsed as { ok?: boolean }).ok) return parsed;
      }
    } catch {
      /* fall through to demo */
    }
  }
  return demoPipelineResult;
}