// ---------------------------------------------------------------------------
// JD Quality Checker — deterministic lint for generated job descriptions
// ---------------------------------------------------------------------------
// Pure and client-safe. Flags exclusionary / cliché wording, must-have skills
// that never appear in the text, missing sections and length problems.
// ---------------------------------------------------------------------------

export interface JDQualityIssue {
  severity: "warn" | "info";
  message: string;
}

export interface JDQualityReport {
  score: number; // 0..100
  wordCount: number;
  readingMinutes: number;
  issues: JDQualityIssue[];
  missingSkills: string[];
}

const FLAGGED_TERMS: Array<{ re: RegExp; hint: string }> = [
  {
    re: /\b(rockstar|ninja|guru|wizard|superhero)\b/i,
    hint: "jargon titles put off many qualified applicants",
  },
  {
    re: /\b(digital native|young and energetic|recent graduates? only)\b/i,
    hint: "age-coded wording",
  },
  { re: /\b(he|him|his|she|her)\b/i, hint: "gendered pronouns — prefer 'you' or 'they'" },
  { re: /\b(manpower|chairman|salesman|guys)\b/i, hint: "gendered nouns" },
  { re: /\b(aggressive|dominant|fearless)\b/i, hint: "masculine-coded traits" },
  { re: /\bwork hard,? play hard\b/i, hint: "cliché that signals poor work-life balance" },
  { re: /\b(native english speaker|mother tongue)\b/i, hint: "prefer 'fluent in English'" },
];

const EXPECTED_SECTIONS = ["about the role", "responsibilities", "must-have", "nice to have"];

export function checkJDQuality(markdown: string, mustHaveSkills = ""): JDQualityReport {
  const text = markdown ?? "";
  const plain = text.replace(/[#*_`>-]/g, " ");
  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  const lower = text.toLowerCase();
  const issues: JDQualityIssue[] = [];
  let score = 100;

  for (const { re, hint } of FLAGGED_TERMS) {
    const m = re.exec(text);
    if (m) {
      issues.push({ severity: "warn", message: `"${m[0]}" — ${hint}.` });
      score -= 8;
    }
  }

  const headings = (text.match(/^#{1,3}\s+.+$/gm) ?? []).map((h) => h.toLowerCase());
  for (const section of EXPECTED_SECTIONS) {
    if (!headings.some((h) => h.includes(section))) {
      issues.push({ severity: "info", message: `Missing a "${section}" section.` });
      score -= 6;
    }
  }

  if (wordCount < 250) {
    issues.push({
      severity: "warn",
      message: "Very short — candidates may lack context to apply.",
    });
    score -= 10;
  } else if (wordCount > 900) {
    issues.push({ severity: "info", message: "Long JD — 400-800 words tends to convert best." });
    score -= 5;
  }

  const mustHaveBullets = countBulletsUnder(text, /must-have|what you bring|requirements/i);
  if (mustHaveBullets > 10) {
    issues.push({
      severity: "warn",
      message: `${mustHaveBullets} must-haves — long requirement lists shrink the applicant pool.`,
    });
    score -= 6;
  }

  const missingSkills = mustHaveSkills
    .split(/[,\n;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .filter((s) => !lower.includes(s.toLowerCase()));
  if (missingSkills.length) {
    issues.push({
      severity: "warn",
      message: `Must-have skill${missingSkills.length === 1 ? "" : "s"} not mentioned: ${missingSkills.join(", ")}.`,
    });
    score -= Math.min(20, missingSkills.length * 5);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / 230)),
    issues,
    missingSkills,
  };
}

function countBulletsUnder(markdown: string, heading: RegExp): number {
  let inSection = false;
  let count = 0;
  for (const line of markdown.split("\n")) {
    if (/^#{1,3}\s/.test(line)) {
      inSection = heading.test(line);
      continue;
    }
    if (inSection && /^\s*[-*]\s+\S/.test(line)) count += 1;
  }
  return count;
}
