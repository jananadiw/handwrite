import * as opentype from "opentype.js";
import {
  DEFAULT_FONT_METRICS,
  SUPPORTED_GLYPHS,
} from "@/lib/extraction/constants";
import { FONT_FAMILY_NAME, FONT_MIME_TYPE } from "@/lib/font/constants";

export const LETTER_SPACING_MIN_EM = -0.5;
export const LETTER_SPACING_MAX_EM = 1;
export const LETTER_SPACING_STEP_EM = 0.01;

export function formatLetterSpacingEm(value: number) {
  if (value === 0) {
    return "0em";
  }

  const rounded = Math.round(value * 100) / 100;
  const sign = rounded > 0 ? "+" : "";

  return `${sign}${rounded.toFixed(2)}em`;
}

export function applyLetterSpacingToFont(
  font: opentype.Font,
  {
    letterSpacingEm,
  }: {
    letterSpacingEm: number;
  },
) {
  const spacingUnits = Math.round(letterSpacingEm * font.unitsPerEm);
  const glyphs: opentype.Glyph[] = [];

  for (let index = 0; index < font.glyphs.length; index += 1) {
    const glyph = font.glyphs.get(index);
    const nextAdvanceWidth = isAdjustableLetterGlyph(glyph)
      ? getSpacedAdvanceWidth(glyph, spacingUnits)
      : (glyph.advanceWidth ?? 0);

    glyphs.push(
      new opentype.Glyph({
        advanceWidth: nextAdvanceWidth,
        leftSideBearing: glyph.leftSideBearing,
        name: glyph.name ?? undefined,
        path: glyph.path,
        unicode: glyph.unicode,
        unicodes: glyph.unicodes,
      }),
    );
  }

  return new opentype.Font({
    ascender: font.ascender,
    descender: font.descender,
    familyName: getFontFamilyName(font),
    glyphs,
    styleName: getFontStyleName(font),
    unitsPerEm: font.unitsPerEm,
  });
}

export async function adjustFontLetterSpacing(
  fontBlob: Blob,
  {
    letterSpacingEm,
  }: {
    letterSpacingEm: number;
  },
) {
  const font = opentype.parse(await fontBlob.arrayBuffer());
  const adjustedFont = applyLetterSpacingToFont(font, { letterSpacingEm });

  return new Blob([adjustedFont.toArrayBuffer()], { type: FONT_MIME_TYPE });
}

/**
 * Letters tighten until their ink touches and no further. Every glyph in this
 * pipeline carries the same left side bearing, so a glyph's ink width is exactly
 * the advance width at which it meets the next letter. Flooring per glyph keeps
 * narrow and wide letters from converging on one shared width.
 */
function getSpacedAdvanceWidth(glyph: opentype.Glyph, spacingUnits: number) {
  return Math.max(
    getInkWidth(glyph),
    (glyph.advanceWidth ?? 0) + spacingUnits,
  );
}

function getInkWidth(glyph: opentype.Glyph) {
  const bounds = glyph.getBoundingBox();
  const inkWidth = Math.round(bounds.x2 - bounds.x1);

  if (!Number.isFinite(inkWidth) || inkWidth <= 0) {
    return Math.round(DEFAULT_FONT_METRICS.unitsPerEm / 4);
  }

  return inkWidth;
}

function isAdjustableLetterGlyph(glyph: opentype.Glyph) {
  const codePoint = glyph.unicode ?? glyph.unicodes?.[0];

  if (!codePoint) {
    return false;
  }

  const char = String.fromCodePoint(codePoint);

  return SUPPORTED_GLYPHS.includes(char as (typeof SUPPORTED_GLYPHS)[number]);
}

function getFontFamilyName(font: opentype.Font) {
  return font.names?.fontFamily?.en ?? FONT_FAMILY_NAME;
}

function getFontStyleName(font: opentype.Font) {
  return font.names?.fontSubfamily?.en ?? "Regular";
}
