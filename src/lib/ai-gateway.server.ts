import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Default model used across all AI extractions (Lovable AI Gateway). */
export const AI_MODEL = "google/gemini-3.6-flash";
/** Model used when falling back to a direct Groq key. */
export const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Returns a configured chat model.
 * Prefers the Lovable AI Gateway (`LOVABLE_API_KEY`); falls back to a direct
 * Groq key (`AI_API_KEY`) when one is configured.
 */
export function getAiModel() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) {
    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": lovableKey },
      supportsStructuredOutputs: true,
    });
    return gateway(AI_MODEL);
  }

  const groqKey = process.env["AI_API_KEY"];
  if (groqKey) return createGroq({ apiKey: groqKey })(GROQ_MODEL);

  console.warn("[ai-gateway] No AI key configured — AI features are disabled.");
  return null;
}

/** Back-compat helper. */
export function createAiGatewayProvider(apiKey?: string) {
  const key = apiKey ?? process.env["AI_API_KEY"];
  if (!key) return null;
  return createGroq({ apiKey: key });
}
