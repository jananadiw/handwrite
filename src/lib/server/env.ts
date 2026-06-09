import "server-only";

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY;
}

export function requireGeminiApiKey() {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}
