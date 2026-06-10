import "server-only";

import {
  createPartFromBase64,
  GoogleGenAI,
  PartMediaResolutionLevel,
} from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  GEMINI_ANALYSIS_MODEL,
  SUPPORTED_LETTERS,
} from "@/lib/extraction/constants";
import {
  compactAlphabetAnalysisSchema,
  expandCompactAlphabetAnalysis,
  type AlphabetAnalysis,
} from "@/lib/extraction/schemas";
import { requireGeminiApiKey } from "@/lib/server/env";

const compactAlphabetAnalysisJsonSchema = zodToJsonSchema(
  compactAlphabetAnalysisSchema,
);

const analysisPrompt = `
Analyze a freeform handwritten alphabet photo for font extraction.
Detect both uppercase A-Z and lowercase a-z when present.
Return JSON only. Boxes use [ymin,xmin,ymax,xmax], normalized 0..1000.
Use compact letter keys: c=letter, b=box, q=confidence percent, i=issues.
Omit i and globalIssues when empty. Mark usable false for blur, darkness,
severe angle, many missing uppercase letters, touching letters, or unmappable layout.
orientationDegrees is the clockwise rotation needed to make letters upright.
When uppercase and lowercase are written as pairs, return separate boxes for
each glyph, e.g. A and a are separate detections.
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

  const detectedUppercaseLetters = new Set(
    analysis.letters
      .filter((letter) => isSupportedUppercaseLetter(letter.char))
      .map((letter) => letter.char),
  );
  const averageConfidence =
    analysis.letters.reduce((total, letter) => total + letter.confidence, 0) /
    Math.max(analysis.letters.length, 1);

  return (
    detectedUppercaseLetters.size >= SUPPORTED_LETTERS.length &&
    averageConfidence >= 0.82
  );
}

function isSupportedUppercaseLetter(letter: string) {
  return (SUPPORTED_LETTERS as readonly string[]).includes(letter);
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
