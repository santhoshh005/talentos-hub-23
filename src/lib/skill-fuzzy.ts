// ---------------------------------------------------------------------------
// Skill fuzzy matching — pure, conservative, token-aware.
// ---------------------------------------------------------------------------
// Shared by the semantic matcher and its tests. Never matches on raw
// substrings, so "Java" != "JavaScript", "R" != "React", "Go" != "Google".
// ---------------------------------------------------------------------------

const QUALIFIER_RE =
  /^(?:certification in|certified|familiarity with|knowledge of|experience (?:with|in)|understanding of|proficiency in|hands[- ]on)\s+/i;

export function skillTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(QUALIFIER_RE, "")
    .replace(/\(([^)]*)\)/g, " $1 ")
    .split(/[^a-z0-9+#.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter(Boolean);
}

/**
 * Conservative fuzzy equivalence. Requires whole-token containment so that
 * "Java" never matches "JavaScript", "R" never matches "React", and "Go"
 * never matches "Google". Single-token skills shorter than 3 chars must match
 * exactly.
 */
export function fuzzyMatch(jdSkill: string, candidateSkill: string): boolean {
  const a = skillTokens(jdSkill);
  const b = skillTokens(candidateSkill);
  if (!a.length || !b.length) return false;
  const ja = a.join(" ");
  const jb = b.join(" ");
  if (ja === jb) return true;
  // Compact form handles "Node.js" vs "NodeJS", "CI/CD" vs "CICD".
  const compact = (v: string) => v.replace(/[^a-z0-9+#]/g, "").replace(/(?<=[a-z]{3})js$/, "");
  const ca = compact(ja);
  const cb = compact(jb);
  if (ca.length >= 3 && ca === cb) return true;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  if (shorter.join("").length < 3) return false;
  // Every token of the shorter phrase must appear as a whole token in the longer one,
  // and the shorter phrase must carry most of the meaning (avoid "Cloud" ~ "Sales Cloud").
  const longerSet = new Set(longer);
  if (!shorter.every((t) => longerSet.has(t))) return false;
  return shorter.length / longer.length > 0.5 && longer.length <= 4;
}
