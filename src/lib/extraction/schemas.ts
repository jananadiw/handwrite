import { z } from "zod";
import {
  NORMALIZED_COORDINATE_MAX,
  SUPPORTED_LETTERS,
} from "@/lib/extraction/constants";

export const letterCharSchema = z.enum(SUPPORTED_LETTERS);

export const normalizedCoordinateSchema = z
  .number()
  .min(0)
  .max(NORMALIZED_COORDINATE_MAX);

export const normalizedBoxSchema = z
  .tuple([
    normalizedCoordinateSchema,
    normalizedCoordinateSchema,
    normalizedCoordinateSchema,
    normalizedCoordinateSchema,
  ])
  .describe("[ymin, xmin, ymax, xmax] in Gemini normalized 0..1000 space.");

export const pointSchema = z.object({
  x: normalizedCoordinateSchema,
  y: normalizedCoordinateSchema,
});

export const pageCornersSchema = z.object({
  topLeft: pointSchema,
  topRight: pointSchema,
  bottomRight: pointSchema,
  bottomLeft: pointSchema,
});

export const letterDetectionSchema = z.object({
  char: letterCharSchema,
  box: normalizedBoxSchema,
  confidence: z.number().min(0).max(1),
  issues: z.array(z.string()).default([]),
});

export const alphabetAnalysisSchema = z.object({
  usable: z.boolean(),
  rejectReason: z.string().optional(),
  orientationDegrees: z.union([
    z.literal(0),
    z.literal(90),
    z.literal(180),
    z.literal(270),
  ]),
  pageCorners: pageCornersSchema.optional(),
  letters: z.array(letterDetectionSchema),
  globalIssues: z.array(z.string()),
});

// Compact Gemini-only schema to reduce output tokens.
// c = character, b = bounding box, q = quality/confidence percentage, i = issues.
export const compactLetterDetectionSchema = z.object({
  c: letterCharSchema,
  b: normalizedBoxSchema,
  q: z.number().min(0).max(100),
  i: z.array(z.string()).optional(),
});

export const compactAlphabetAnalysisSchema = z.object({
  usable: z.boolean(),
  rejectReason: z.string().optional(),
  orientationDegrees: z.union([
    z.literal(0),
    z.literal(90),
    z.literal(180),
    z.literal(270),
  ]),
  pageCorners: pageCornersSchema.optional(),
  letters: z.array(compactLetterDetectionSchema),
  globalIssues: z.array(z.string()).optional(),
});

export type LetterChar = z.infer<typeof letterCharSchema>;
export type NormalizedBox = z.infer<typeof normalizedBoxSchema>;
export type PageCorners = z.infer<typeof pageCornersSchema>;
export type LetterDetection = z.infer<typeof letterDetectionSchema>;
export type AlphabetAnalysis = z.infer<typeof alphabetAnalysisSchema>;
export type CompactAlphabetAnalysis = z.infer<
  typeof compactAlphabetAnalysisSchema
>;

export type PixelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function normalizedBoxToPixelRect({
  box,
  imageWidth,
  imageHeight,
}: {
  box: NormalizedBox;
  imageWidth: number;
  imageHeight: number;
}): PixelRect {
  const [ymin, xmin, ymax, xmax] = box;
  const x1 = Math.round((xmin / NORMALIZED_COORDINATE_MAX) * imageWidth);
  const y1 = Math.round((ymin / NORMALIZED_COORDINATE_MAX) * imageHeight);
  const x2 = Math.round((xmax / NORMALIZED_COORDINATE_MAX) * imageWidth);
  const y2 = Math.round((ymax / NORMALIZED_COORDINATE_MAX) * imageHeight);

  return {
    x: Math.max(0, x1),
    y: Math.max(0, y1),
    width: Math.max(0, Math.min(imageWidth, x2) - Math.max(0, x1)),
    height: Math.max(0, Math.min(imageHeight, y2) - Math.max(0, y1)),
  };
}

export function expandCompactAlphabetAnalysis(
  compactAnalysis: CompactAlphabetAnalysis,
): AlphabetAnalysis {
  return alphabetAnalysisSchema.parse({
    usable: compactAnalysis.usable,
    rejectReason: compactAnalysis.rejectReason,
    orientationDegrees: compactAnalysis.orientationDegrees,
    pageCorners: compactAnalysis.pageCorners,
    letters: compactAnalysis.letters.map((letter) => ({
      char: letter.c,
      box: letter.b,
      confidence: letter.q / 100,
      issues: letter.i ?? [],
    })),
    globalIssues: compactAnalysis.globalIssues ?? [],
  });
}
