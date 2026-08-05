// ---------------------------------------------------------------------------
// TalentOS JD Studio — AI-powered Job Description generator
// ---------------------------------------------------------------------------

import { generateText } from "ai";
import { getAiModel } from "./ai-gateway.server";

export interface JDStudioInput {
  positionTitle: string;
  department: string;
  level: string;
  location: string;
  employmentType: string;
  requiredExperience: string;
  roleDescription: string;
  mustHaveSkills: string;
  tone: string;
}

const SYSTEM_PROMPT = [
  "You are an expert Senior Talent Acquisition Specialist with 15+ years of experience writing",
  "highly detailed, compelling, and inclusive job descriptions for top-tier companies.",
  "Your JDs are known for:",
  "- Being extremely specific about skills, tools, and technologies required",
  "- Avoiding generic or vague bullet points (e.g., 'work with team', 'develop software')",
  "- Emphasizing actionable outcomes and precise technological constraints",
  "- Maintaining an inclusive and unbiased tone",
  "CRITICAL: Always return ONLY the raw Markdown content — no preamble, no explanation, no conversational text like 'Here is your job description'. Start immediately with the first section.",
].join(" ");

export async function generateJdContent(input: JDStudioInput): Promise<string> {
  const model = getAiModel();
  if (!model) {
    throw new Error("AI API Key is not configured. Add AI_API_KEY to .env to enable JD Studio.");
  }

  const prompt = `Write a detailed, professional Job Description for this role:

**Position**: ${input.positionTitle}
**Department**: ${input.department || "Not specified"}
**Seniority**: ${input.level || "Not specified"}
**Location**: ${input.location}
**Employment Type**: ${input.employmentType || "Full-Time"}
**Experience Required**: ${input.requiredExperience}
**Role Overview**: ${input.roleDescription}
**Must-Have Skills**: ${input.mustHaveSkills}
**Tone/Style**: ${input.tone}

Format the JD in clean Markdown with EXACTLY these five sections:

## About the Role
[2-3 compelling sentences describing the role's impact and mission. Be specific, not generic.]

## Key Responsibilities
[8-12 highly specific bullet points. Each responsibility should be a concrete action with measurable context. Avoid vague statements like "work with team". Instead: "Design and own the end-to-end data pipeline architecture for 50M+ events/day".]

## What You Bring (Must-Haves)
[List each required skill/qualification as a bullet. Include specific version numbers, years of experience, and use-case context where relevant. Example: "5+ years of Python (FastAPI, asyncio, Pandas) for production-grade data services".]

## Nice to Have
[3-5 bonus skills or experiences that would make the candidate stand out.]

## Why Join Us
[3-4 bullet points with genuine, specific reasons this role is exciting. Mention team culture, tech stack, impact, and growth opportunities.]

Be highly specific. Use the must-have skills (${input.mustHaveSkills}) throughout the JD naturally.`;

  try {
    const { text } = await generateText({
      model,
      temperature: 0.4,
      prompt,
      system: SYSTEM_PROMPT,
    });
    return text.trim();
  } catch (error: unknown) {
    console.error("[jd-studio] Failed to generate JD", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate job description.");
  }
}

export async function generateJdFromResume(resumeText: string, tone: string): Promise<string> {
  const model = getAiModel();
  if (!model) {
    throw new Error("AI API Key is not configured. Add AI_API_KEY to .env to enable JD Studio.");
  }

  const prompt = `Analyze this resume carefully and reverse-engineer a highly specific, compelling Job Description for the exact role this candidate would be perfectly suited for.

RESUME:
---
${resumeText.slice(0, 12000)}
---

Instructions:
1. Identify the candidate's: seniority level, domain/industry, primary skills, years of experience, and most impressive accomplishments
2. Write a JD that perfectly matches their profile — not too senior, not too junior
3. Use their specific technologies, tools, and domain context throughout
4. Tone/Style: ${tone}

Format in clean Markdown with EXACTLY these five sections:

## About the Role
## Key Responsibilities  
## What You Bring (Must-Haves)
## Nice to Have
## Why Join Us

Be highly specific and technical. Mirror the candidate's actual skills and experience level.`;

  try {
    const { text } = await generateText({
      model,
      temperature: 0.4,
      prompt,
      system: SYSTEM_PROMPT,
    });
    return text.trim();
  } catch (error: unknown) {
    console.error("[jd-studio] Failed to generate JD from resume", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate job description from resume.",
    );
  }
}
