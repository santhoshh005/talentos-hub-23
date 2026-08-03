// ---------------------------------------------------------------------------
// TalentOS AI Gateway — Groq (llama-3.3-70b-versatile)
// ---------------------------------------------------------------------------
// Reads AI_API_KEY from the environment. All AI calls across the pipeline
// route through getAiModel(). Returns null when the key is not configured,
// causing every caller to fall back to its local deterministic parser.
// ---------------------------------------------------------------------------

import { createGroq } from "@ai-sdk/groq";

/** The Groq model used for all AI extractions and matching. */
export const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Returns a configured Groq language model instance.
 * Reads AI_API_KEY from the environment at call time (works in SSR/Nitro).
 * Returns null when no key is available — every caller must handle null.
 */
export function getAiModel() {
  const key =
    process.env["AI_API_KEY"] ?? process.env["GROQ_API_KEY"] ?? process.env["VITE_GROQ_API_KEY"];

  if (!key) {
    console.warn(
      "[ai-gateway] No Groq API key found. Set AI_API_KEY in .env to enable AI features.",
    );
    return null;
  }

  const groq = createGroq({ apiKey: key });
  return groq(GROQ_MODEL);
}

/** Back-compat helper used by older callers. */
export function createAiGatewayProvider(apiKey?: string) {
  const key = apiKey ?? process.env["AI_API_KEY"] ?? process.env["GROQ_API_KEY"];
  if (!key) return null;
  return createGroq({ apiKey: key });
}

/** Convenience: get model in one call. */
export { getAiModel as getAiGatewayModel };
