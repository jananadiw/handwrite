import { describe, expect, test } from "bun:test";
import {
  compactAlphabetAnalysisSchema,
  expandCompactAlphabetAnalysis,
} from "./schemas";

describe("alphabet analysis schemas", () => {
  test("accepts uppercase and lowercase glyph detections", () => {
    const compactAnalysis = compactAlphabetAnalysisSchema.parse({
      usable: true,
      orientationDegrees: 0,
      letters: [
        { c: "A", b: [0, 0, 100, 100], q: 95 },
        { c: "a", b: [0, 120, 80, 180], q: 91 },
      ],
    });

    expect(expandCompactAlphabetAnalysis(compactAnalysis).letters).toEqual([
      {
        char: "A",
        box: [0, 0, 100, 100],
        confidence: 0.95,
        issues: [],
      },
      {
        char: "a",
        box: [0, 120, 80, 180],
        confidence: 0.91,
        issues: [],
      },
    ]);
    expect(expandCompactAlphabetAnalysis(compactAnalysis).source).toBe(
      "alphabet",
    );
  });

  test("preserves declaration demo source metadata", () => {
    const compactAnalysis = compactAlphabetAnalysisSchema.parse({
      source: "declaration-demo",
      usable: true,
      orientationDegrees: 0,
      letters: [{ c: "H", b: [0, 0, 100, 100], q: 95 }],
    });

    expect(expandCompactAlphabetAnalysis(compactAnalysis).source).toBe(
      "declaration-demo",
    );
  });
});
