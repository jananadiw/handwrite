import { beforeEach, describe, expect, mock, test } from "bun:test";
import * as opentype from "opentype.js";
import type { LetterDetection } from "@/lib/extraction/schemas";
import type { HandwritingFontSource } from "@/lib/font/types";

const traceCalls: string[] = [];
const closedBitmaps: string[] = [];

mock.module("@/lib/font/helpers/build-glyphs", () => ({
  createEmptyGlyph: ({
    advanceWidth = 1000,
    name,
    unicode,
  }: {
    advanceWidth?: number;
    name: string;
    unicode?: number;
  }) =>
    new opentype.Glyph({
      advanceWidth,
      name,
      path: new opentype.Path(),
      unicode,
    }),
  createLowercaseGlyph: (
    uppercaseLetter: string,
    _uppercasePath: opentype.Path,
    uppercaseAdvanceWidth = 1000,
  ) =>
    new opentype.Glyph({
      advanceWidth: Math.round(uppercaseAdvanceWidth * 0.72),
      name: uppercaseLetter.toLowerCase(),
      path: new opentype.Path(),
      unicode: uppercaseLetter.toLowerCase().charCodeAt(0),
    }),
  traceGlyph: ({
    detection,
    imageBitmap,
  }: {
    detection: LetterDetection;
    imageBitmap: { id: string };
  }) => {
    traceCalls.push(
      `${detection.char}:${detection.confidence}:${imageBitmap.id}`,
    );

    if (detection.issues.includes("force-fail")) {
      return null;
    }

    return new opentype.Glyph({
      advanceWidth: 1000,
      name: detection.char,
      path: new opentype.Path(),
      unicode: detection.char.charCodeAt(0),
    });
  },
}));

const { generateHandwritingFont } = await import("./generate-handwriting-font");

describe("generateHandwritingFont", () => {
  beforeEach(() => {
    traceCalls.length = 0;
    closedBitmaps.length = 0;

    Object.assign(globalThis, {
      createImageBitmap: async (photo: Blob) => {
        const id = await photo.text();

        return {
          id,
          close: () => closedBitmaps.push(id),
        };
      },
    });
  });

  test("merges sources and tries higher-confidence detections first", async () => {
    const font = await generateHandwritingFont({
      sources: [
        createSource("first", [
          createDetection("A", 0.4),
          createDetection("B", 0.8),
          createDetection("C", 0.4),
        ]),
        createSource("second", [
          createDetection("A", 0.9),
          createDetection("C", 0.95, ["force-fail"]),
        ]),
      ],
    });

    expect(traceCalls).toContain("A:0.9:second");
    expect(traceCalls.indexOf("C:0.95:second")).toBeLessThan(
      traceCalls.indexOf("C:0.4:first"),
    );
    expect(font.generatedLetters).toEqual(["A", "B", "C", "a", "b", "c"]);
    expect(font.missingLetters).not.toContain("A");
    expect(font.missingLetters).not.toContain("a");
    expect(closedBitmaps).toEqual(["first", "second"]);
  });
});

function createSource(
  id: string,
  letters: LetterDetection[],
): HandwritingFontSource {
  return {
    analysis: {
      globalIssues: [],
      letters,
      orientationDegrees: 0,
      usable: true,
    },
    height: 100,
    photo: new Blob([id]),
    width: 100,
  };
}

function createDetection(
  char: LetterDetection["char"],
  confidence: number,
  issues: string[] = [],
): LetterDetection {
  return {
    box: [0, 0, 100, 100],
    char,
    confidence,
    issues,
  };
}
