import * as opentype from "opentype.js";
import {
  DEFAULT_FONT_METRICS,
  SUPPORTED_GLYPHS,
  SUPPORTED_LETTERS,
} from "@/lib/extraction/constants";
import type { LetterDetection } from "@/lib/extraction/schemas";
import {
  FONT_FAMILY_NAME,
  FONT_FILE_NAME,
  FONT_MIME_TYPE,
} from "@/lib/font/constants";
import {
  createEmptyGlyph,
  createLowercaseGlyph,
  traceGlyph,
} from "@/lib/font/helpers/build-glyphs";
import { getMissingLetters } from "@/lib/font/helpers/glyph-detections";
import type {
  GeneratedHandwritingFont,
  HandwritingFontSource,
} from "@/lib/font/types";

export type { GeneratedHandwritingFont } from "@/lib/font/types";

export async function generateHandwritingFont({
  sources,
}: {
  sources: HandwritingFontSource[];
}): Promise<GeneratedHandwritingFont> {
  const fontSources = await Promise.all(
    sources.map(async (source) => ({
      analysis: source.analysis,
      imageBitmap: await createImageBitmap(source.photo),
      imageHeight: source.height,
      imageWidth: source.width,
      kind: source.kind ?? "photo",
    })),
  );

  try {
    const { generatedLetters, glyphs } = buildGlyphs({
      sources: fontSources,
    });

    if (generatedLetters.length === 0) {
      throw new Error("No letters could be traced from the photo.");
    }

    const font = new opentype.Font({
      familyName: FONT_FAMILY_NAME,
      styleName: "Regular",
      unitsPerEm: DEFAULT_FONT_METRICS.unitsPerEm,
      ascender: DEFAULT_FONT_METRICS.ascender,
      descender: DEFAULT_FONT_METRICS.descender,
      glyphs,
    });

    return {
      blob: new Blob([font.toArrayBuffer()], { type: FONT_MIME_TYPE }),
      familyName: FONT_FAMILY_NAME,
      fileName: FONT_FILE_NAME,
      generatedLetters,
      missingLetters: getMissingLetters(generatedLetters),
    };
  } finally {
    for (const source of fontSources) {
      source.imageBitmap.close();
    }
  }
}

function buildGlyphs({
  sources,
}: {
  sources: TracingSource[];
}) {
  const glyphs: opentype.Glyph[] = [
    createEmptyGlyph({ name: ".notdef" }),
    createEmptyGlyph({
      advanceWidth: DEFAULT_FONT_METRICS.unitsPerEm / 2,
      name: "space",
      unicode: 32,
    }),
  ];
  const generatedLetters: string[] = [];

  for (const letter of SUPPORTED_GLYPHS) {
    const candidates = getDetectionCandidates({ letter, sources });

    for (const candidate of candidates) {
      const glyph = traceGlyph({
        detection: candidate.detection,
        imageBitmap: candidate.source.imageBitmap,
        imageHeight: candidate.source.imageHeight,
        imageWidth: candidate.source.imageWidth,
        trustInk: candidate.source.kind === "drawn",
      });

      if (!glyph) {
        continue;
      }

      glyphs.push(glyph);
      generatedLetters.push(letter);
      break;
    }
  }

  for (const uppercaseLetter of SUPPORTED_LETTERS) {
    const lowercaseLetter = uppercaseLetter.toLowerCase();

    if (
      generatedLetters.includes(lowercaseLetter) ||
      !generatedLetters.includes(uppercaseLetter)
    ) {
      continue;
    }

    const uppercaseGlyph = glyphs.find(
      (glyph) => glyph.name === uppercaseLetter,
    );

    if (!uppercaseGlyph) {
      continue;
    }

    glyphs.push(
      createLowercaseGlyph(
        uppercaseLetter,
        uppercaseGlyph.path,
        uppercaseGlyph.advanceWidth,
      ),
    );
    generatedLetters.push(lowercaseLetter);
  }

  return { generatedLetters, glyphs };
}

type TracingSource = {
  analysis: HandwritingFontSource["analysis"];
  imageBitmap: ImageBitmap;
  imageHeight: number;
  imageWidth: number;
  kind: NonNullable<HandwritingFontSource["kind"]>;
};

type DetectionCandidate = {
  detection: LetterDetection;
  source: TracingSource;
};

function getDetectionCandidates({
  letter,
  sources,
}: {
  letter: string;
  sources: TracingSource[];
}): DetectionCandidate[] {
  return sources
    .flatMap((source) =>
      source.analysis.letters
        .filter((detection) => detection.char === letter)
        .map((detection) => ({ detection, source })),
    )
    .sort(
      (left, right) => right.detection.confidence - left.detection.confidence,
    );
}
