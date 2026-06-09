import * as opentype from "opentype.js";
import { DEFAULT_FONT_METRICS } from "@/lib/extraction/constants";
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
import {
  getBestDetections,
  getMissingLetters,
} from "@/lib/font/helpers/glyph-detections";
import type { GeneratedHandwritingFont } from "@/lib/font/types";
import type { AlphabetAnalysis } from "@/lib/extraction/schemas";
import type { NormalisedJpeg } from "@/lib/images/normalise-to-jpeg";

export type { GeneratedHandwritingFont } from "@/lib/font/types";

export async function generateHandwritingFont({
  analysis,
  normalisedPhoto,
}: {
  analysis: AlphabetAnalysis;
  normalisedPhoto: NormalisedJpeg;
}): Promise<GeneratedHandwritingFont> {
  const imageBitmap = await createImageBitmap(normalisedPhoto.blob);

  try {
    const { generatedLetters, glyphs } = buildGlyphs({
      analysis,
      imageBitmap,
      normalisedPhoto,
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
    imageBitmap.close();
  }
}

function buildGlyphs({
  analysis,
  imageBitmap,
  normalisedPhoto,
}: {
  analysis: AlphabetAnalysis;
  imageBitmap: ImageBitmap;
  normalisedPhoto: NormalisedJpeg;
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

  for (const [letter, detection] of getBestDetections(analysis)) {
    const glyph = traceGlyph({
      detection,
      imageBitmap,
      imageHeight: normalisedPhoto.height,
      imageWidth: normalisedPhoto.width,
    });

    if (!glyph) {
      continue;
    }

    glyphs.push(glyph);
    glyphs.push(createLowercaseGlyph(letter, glyph.path, glyph.advanceWidth));
    generatedLetters.push(letter);
  }

  return { generatedLetters, glyphs };
}
