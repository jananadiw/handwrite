import { describe, expect, test } from "bun:test";
import * as opentype from "opentype.js";
import {
  adjustFontLetterSpacing,
  applyLetterSpacingToFont,
  formatLetterSpacingEm,
} from "./adjust-letter-spacing";

const WIDE_LETTER_INK_WIDTH = 440;
const NARROW_LETTER_INK_WIDTH = 240;

describe("adjustLetterSpacing", () => {
  test("formats em values for the spacing UI", () => {
    expect(formatLetterSpacingEm(0)).toBe("0em");
    expect(formatLetterSpacingEm(0.25)).toBe("+0.25em");
    expect(formatLetterSpacingEm(-0.1)).toBe("-0.10em");
  });

  test("adds spacing units to each letter advance width", () => {
    const font = createSampleFont();
    const adjusted = applyLetterSpacingToFont(font, { letterSpacingEm: 0.1 });

    expect(getGlyph(adjusted, "A").advanceWidth).toBe(660);
    expect(getGlyph(adjusted, "o").advanceWidth).toBe(503);
  });

  test("leaves non-letter glyphs at their original advance width", () => {
    const font = createSampleFont();
    const adjusted = applyLetterSpacingToFont(font, { letterSpacingEm: 0.1 });

    expect(getGlyph(adjusted, " ").advanceWidth).toBe(500);
  });

  test("tightens letters until their ink touches and no further", () => {
    const font = createSampleFont();
    const adjusted = applyLetterSpacingToFont(font, { letterSpacingEm: -0.5 });

    expect(getGlyph(adjusted, "A").advanceWidth).toBe(WIDE_LETTER_INK_WIDTH);
    expect(getGlyph(adjusted, "o").advanceWidth).toBe(NARROW_LETTER_INK_WIDTH);
  });

  test("keeps relative letter widths instead of collapsing to one width", () => {
    const font = createSampleFont();
    const adjusted = applyLetterSpacingToFont(font, { letterSpacingEm: -0.5 });

    expect(getGlyph(adjusted, "A").advanceWidth).toBeGreaterThan(
      getGlyph(adjusted, "o").advanceWidth,
    );
  });

  test("persists spacing through parse, adjust, and serialize", () => {
    const parsedFont = opentype.parse(createSampleFont().toArrayBuffer());
    const adjustedFont = applyLetterSpacingToFont(parsedFont, {
      letterSpacingEm: 0.2,
    });
    const roundTrippedFont = opentype.parse(adjustedFont.toArrayBuffer());

    expect(getGlyph(roundTrippedFont, "A").advanceWidth).toBe(760);
    expect(getGlyph(roundTrippedFont, "o").advanceWidth).toBe(603);
  });

  test("returns a downloadable font blob", async () => {
    const sourceBlob = new Blob([createSampleFont().toArrayBuffer()], {
      type: "font/ttf",
    });
    const adjustedBlob = await adjustFontLetterSpacing(sourceBlob, {
      letterSpacingEm: 0.2,
    });
    const adjustedFont = opentype.parse(await adjustedBlob.arrayBuffer());

    expect(getGlyph(adjustedFont, "A").advanceWidth).toBe(760);
  });
});

function createSampleFont() {
  return new opentype.Font({
    familyName: "Test Handwrite",
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: [
      createGlyph({ advanceWidth: 500, name: ".notdef" }),
      createGlyph({ advanceWidth: 500, name: "space", unicode: 32 }),
      createGlyph({
        advanceWidth: 560,
        inkWidth: WIDE_LETTER_INK_WIDTH,
        name: "A",
        unicode: 65,
      }),
      createGlyph({
        advanceWidth: 403,
        inkWidth: NARROW_LETTER_INK_WIDTH,
        name: "o",
        unicode: 111,
      }),
    ],
  });
}

function createGlyph({
  advanceWidth,
  inkWidth = 0,
  name,
  unicode,
}: {
  advanceWidth: number;
  inkWidth?: number;
  name: string;
  unicode?: number;
}) {
  return new opentype.Glyph({
    advanceWidth,
    name,
    path: inkWidth > 0 ? createInkPath(inkWidth) : new opentype.Path(),
    unicode,
  });
}

/** Matches the pipeline's fixed left side bearing so ink width drives the floor. */
function createInkPath(inkWidth: number) {
  const left = 60;
  const path = new opentype.Path();

  path.moveTo(left, 0);
  path.lineTo(left + inkWidth, 0);
  path.lineTo(left + inkWidth, 700);
  path.lineTo(left, 700);
  path.close();

  return path;
}

function getGlyph(font: opentype.Font, char: string) {
  const glyph = font.charToGlyph(char);

  if (!glyph) {
    throw new Error(`Missing glyph for ${char}`);
  }

  return glyph;
}
