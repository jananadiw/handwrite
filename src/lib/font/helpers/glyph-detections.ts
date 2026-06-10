import { SUPPORTED_GLYPHS } from "@/lib/extraction/constants";
import type {
  AlphabetAnalysis,
  LetterDetection,
} from "@/lib/extraction/schemas";

export function getBestDetections(analysis: AlphabetAnalysis) {
  const detections = new Map<string, LetterDetection>();

  for (const detection of analysis.letters) {
    const current = detections.get(detection.char);

    if (!current || detection.confidence > current.confidence) {
      detections.set(detection.char, detection);
    }
  }

  return detections;
}

export function getMissingLetters(generatedLetters: string[]) {
  const generated = new Set(generatedLetters);

  return SUPPORTED_GLYPHS.filter((letter) => !generated.has(letter));
}
