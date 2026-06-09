import "server-only";

import {
  createPartFromBase64,
  GoogleGenAI,
  PartMediaResolutionLevel,
} from "@google/genai";
import { z } from "zod";
import { GEMINI_ANALYSIS_MODEL } from "@/lib/extraction/constants";
import {
  compactAlphabetAnalysisSchema,
  expandCompactAlphabetAnalysis,
  type AlphabetAnalysis,
} from "@/lib/extraction/schemas";
import { requireGeminiApiKey } from "@/lib/server/env";

const compactAlphabetAnalysisJsonSchema = z.toJSONSchema(
  compactAlphabetAnalysisSchema,
);

const analysisPrompt = `
Analyze a freeform handwritten uppercase A-Z photo for font extraction.
Return JSON only. Boxes use [ymin,xmin,ymax,xmax], normalized 0..1000.
Use compact letter keys: c=letter, b=box, q=confidence percent, i=issues.
Omit i and globalIssues when empty. Mark usable false for blur, darkness,
severe angle, many missing letters, touching letters, or unmappable layout.
orientationDegrees is the clockwise rotation needed to make letters upright.
`;

const analysisResolutions = [
  PartMediaResolutionLevel.MEDIA_RESOLUTION_MEDIUM,
  PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH,
] as const;

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: requireGeminiApiKey(),
    });
  }

  return geminiClient;
}

export async function analyzeAlphabetPhoto({
  imageBytes,
  mimeType,
}: {
  imageBytes: ArrayBuffer;
  mimeType: string;
}): Promise<AlphabetAnalysis> {
  let fallbackAnalysis: AlphabetAnalysis | null = null;

  for (const resolution of analysisResolutions) {
    const analysis = await requestAlphabetAnalysis({
      imageBytes,
      mimeType,
      resolution,
    });

    if (resolution === PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH) {
      return analysis;
    }

    if (isConfidentAnalysis(analysis)) {
      return analysis;
    }

    fallbackAnalysis = analysis;
  }

  if (!fallbackAnalysis) {
    throw new Error("Gemini did not return usable analysis.");
  }

  return fallbackAnalysis;
}

async function requestAlphabetAnalysis({
  imageBytes,
  mimeType,
  resolution,
}: {
  imageBytes: ArrayBuffer;
  mimeType: string;
  resolution: PartMediaResolutionLevel;
}) {
  const imageBase64 = Buffer.from(imageBytes).toString("base64");
  const imagePart = createPartFromBase64(imageBase64, mimeType, resolution);

  const response = await getGeminiClient().models.generateContent({
    model: GEMINI_ANALYSIS_MODEL,
    contents: [imagePart, { text: analysisPrompt }],
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseJsonSchema: compactAlphabetAnalysisJsonSchema,
    },
  });

  logGeminiUsage({ resolution, response });

  if (!response.text) {
    throw new Error("Gemini did not return analysis text.");
  }

  return expandCompactAlphabetAnalysis(
    compactAlphabetAnalysisSchema.parse(JSON.parse(response.text)),
  );
}

function isConfidentAnalysis(analysis: AlphabetAnalysis) {
  if (!analysis.usable) {
    return false;
  }

  const detectedLetters = new Set(analysis.letters.map((letter) => letter.char));
  const averageConfidence =
    analysis.letters.reduce((total, letter) => total + letter.confidence, 0) /
    Math.max(analysis.letters.length, 1);

  return detectedLetters.size >= 26 && averageConfidence >= 0.82;
}

function logGeminiUsage({
  resolution,
  response,
}: {
  resolution: PartMediaResolutionLevel;
  response: Awaited<
    ReturnType<ReturnType<typeof getGeminiClient>["models"]["generateContent"]>
  >;
}) {
  const usage = response.usageMetadata;

  if (!usage) {
    console.info("Gemini alphabet analysis usage unavailable", { resolution });
    return;
  }

  console.info("Gemini alphabet analysis usage", {
    resolution,
    promptTokens: usage.promptTokenCount,
    outputTokens: usage.candidatesTokenCount,
    totalTokens: usage.totalTokenCount,
  });
}
