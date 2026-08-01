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

export async function generateJdContent(input: JDStudioInput): Promise<string> {
  const model = getAiModel();
  if (!model) {
    throw new Error("AI API Key is not configured. Cannot generate JD.");
  }

  const prompt = `
You are an expert Talent Acquisition Specialist.
Your task is to write a highly compelling, inclusive, and professional Job Description.

Here are the details for the role:
- Position Title: ${input.positionTitle}
- Department: ${input.department || "Not specified"}
- Seniority Level: ${input.level || "Not specified"}
- Location: ${input.location}
- Employment Type: ${input.employmentType || "Not specified"}
- Required Experience: ${input.requiredExperience}
- Core Role Description & Overview: ${input.roleDescription}
- Must-Have Skills / Requirements: ${input.mustHaveSkills}
- Requested Tone/Style: ${input.tone}

Please format the Job Description in Markdown with the following sections (use clear headings):
1. About the Role
2. Key Responsibilities
3. What You Bring (Must-Haves)
4. Why Join Us

Ensure the language is inclusive, engaging, and specifically tailored to the requested tone (${input.tone}).
Do not include any placeholders like [Company Name], just write it in a way that feels complete, or use "our company".
Return ONLY the raw markdown content.
`;

  try {
    const { text } = await generateText({
      model,
      temperature: 0.7,
      prompt,
    });
    return text.trim();
  } catch (error: any) {
    console.error("[jd-studio] Failed to generate JD", error);
    throw new Error(error?.message || "Failed to generate job description.");
  }
}

export async function generateJdFromResume(resumeText: string, tone: string): Promise<string> {
  const model = getAiModel();
  if (!model) {
    throw new Error("AI API Key is not configured. Cannot generate JD.");
  }

  const prompt = `
You are an expert Talent Acquisition Specialist.
Your task is to write a highly compelling, inclusive, and professional Job Description specifically tailored to the following candidate's resume. 

Here is the raw resume text:
---
${resumeText}
---

Your goal is to reverse-engineer a job description for the exact role this candidate would be perfectly suited for. 
Extract their core competencies, seniority level, domain expertise, and the key responsibilities they have handled, and turn those into the requirements and responsibilities for this Job Description.

Requested Tone/Style: ${tone}

Please format the Job Description in Markdown with the following sections (use clear headings):
1. About the Role
2. Key Responsibilities
3. What You Bring (Must-Haves)
4. Why Join Us

Ensure the language is inclusive, engaging, and specifically tailored to the requested tone (${tone}).
Do not include any placeholders like [Company Name], just write it in a way that feels complete, or use "our company".
Return ONLY the raw markdown content.
`;

  try {
    const { text } = await generateText({
      model,
      temperature: 0.7,
      prompt,
    });
    return text.trim();
  } catch (error: any) {
    console.error("[jd-studio] Failed to generate JD from resume", error);
    throw new Error(error?.message || "Failed to generate job description from resume.");
  }
}
