import { createGroq } from "@ai-sdk/groq";

/** Default model used across all AI extractions. */
export const AI_MODEL = "llama-3.1-70b-versatile";

/**
 * Returns a configured Google Generative AI provider.
 * Reads `AI_API_KEY` from the environment when no key is supplied.
 */
export function createAiGatewayProvider(apiKey?: string) {
  const key = apiKey ?? process.env.AI_API_KEY;
  if (!key) {
    console.warn("[ai-gateway] AI_API_KEY is not set — AI features will be disabled.");
    return null;
  }
  return createGroq({ apiKey: key });
}

/** Convenience: get the gateway + model in one call. Returns null when no key is configured. */
export function getAiModel() {
  const gateway = createAiGatewayProvider();
  if (!gateway) return null;
  return gateway(AI_MODEL);
}
