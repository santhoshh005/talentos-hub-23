import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function createAiGatewayProvider(apiKey: string, options?: { structuredOutputs?: boolean }) {
  return createGoogleGenerativeAI({
    apiKey,
  });
}
