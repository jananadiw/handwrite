import { describe, expect, test } from "bun:test";
import {
  GLYPH_PADDING_RATIO,
  MAX_GLYPH_INK_COVERAGE,
  MIN_GLYPH_INK_COVERAGE,
} from "@/lib/font/constants";
import { normalizedBoxToPixelRect } from "@/lib/extraction/schemas";
import {
  countInkPixels,
  getInkBounds,
} from "@/lib/font/helpers/ink-mask";
import {
  createDrawnAnalysis,
  DRAWN_CELL_SIZE,
  DRAWN_GRID_COLUMNS,
  getDrawnCellRect,
  getDrawnGridLayout,
  hasDrawnInk,
  toNormalizedBox,
  type DrawnGlyph,
} from "@/lib/font/drawn-glyphs";

const SAMPLE_STROKE = [
  { pressure: 0.5, x: 0.2, y: 0.2 },
  { pressure: 0.5, x: 0.8, y: 0.8 },
];

function createGlyphs(chars: string[]): DrawnGlyph[] {
  return chars.map((char) => ({
    char: char as DrawnGlyph["char"],
    strokes: [SAMPLE_STROKE],
  }));
}

describe("drawn glyph layout", () => {
  test("keeps a single row until the column limit is reached", () => {
    expect(getDrawnGridLayout(3)).toEqual({
      columns: 3,
      height: DRAWN_CELL_SIZE,
      rows: 1,
      width: 3 * DRAWN_CELL_SIZE,
    });
  });

  test("wraps into rows beyond the column limit", () => {
    const layout = getDrawnGridLayout(52);

    expect(layout.columns).toBe(DRAWN_GRID_COLUMNS);
    expect(layout.rows).toBe(Math.ceil(52 / DRAWN_GRID_COLUMNS));
    expect(layout.height).toBe(layout.rows * DRAWN_CELL_SIZE);
  });

  test("insets ink inside its cell", () => {
    const rect = getDrawnCellRect(0, 8);

    expect(rect.x).toBeGreaterThan(0);
    expect(rect.y).toBeGreaterThan(0);
    expect(rect.x + rect.width).toBeLessThan(DRAWN_CELL_SIZE);
    expect(rect.y + rect.height).toBeLessThan(DRAWN_CELL_SIZE);
  });

  test("places cells in row-major order", () => {
    const ninth = getDrawnCellRect(8, 8);

    expect(ninth.x).toBe(getDrawnCellRect(0, 8).x);
    expect(ninth.y).toBe(getDrawnCellRect(0, 8).y + DRAWN_CELL_SIZE);
  });

  test("pads without reaching a neighbouring cell", () => {
    const rect = getDrawnCellRect(0, 8);
    const padding = rect.width * GLYPH_PADDING_RATIO;

    expect(rect.x - padding).toBeGreaterThan(0);
    expect(rect.x + rect.width + padding).toBeLessThan(DRAWN_CELL_SIZE);
    expect(rect.y - padding).toBeGreaterThan(0);
    expect(rect.y + rect.height + padding).toBeLessThan(DRAWN_CELL_SIZE);
  });
});

describe("drawn glyph analysis", () => {
  test("produces an analysis the pipeline can consume", () => {
    const glyphs = createGlyphs(["A", "B", "c"]);
    const analysis = createDrawnAnalysis(
      glyphs,
      getDrawnGridLayout(glyphs.length),
    );

    expect(analysis.usable).toBe(true);
    expect(analysis.orientationDegrees).toBe(0);
    expect(analysis.globalIssues).toEqual([]);
    expect(analysis.letters.map((letter) => letter.char)).toEqual([
      "A",
      "B",
      "c",
    ]);

    for (const letter of analysis.letters) {
      expect(letter.box).toHaveLength(4);
      expect(letter.confidence).toBe(1);
      expect(letter.issues).toEqual([]);
      expect(Math.min(...letter.box)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...letter.box)).toBeLessThanOrEqual(1000);
      expect(letter.box.every((value) => Number.isInteger(value))).toBe(true);
    }
  });

  test("round-trips boxes back to the drawn cell rect", () => {
    const glyphs = createGlyphs(["A", "B"]);
    const layout = getDrawnGridLayout(glyphs.length);
    const analysis = createDrawnAnalysis(glyphs, layout);
    const expectedRect = getDrawnCellRect(1, layout.columns);
    const actualRect = normalizedBoxToPixelRect({
      box: analysis.letters[1].box,
      imageHeight: layout.height,
      imageWidth: layout.width,
    });

    expect(actualRect.x).toBeCloseTo(expectedRect.x, 0);
    expect(actualRect.y).toBeCloseTo(expectedRect.y, 0);
    expect(actualRect.width).toBeCloseTo(expectedRect.width, 0);
    expect(actualRect.height).toBeCloseTo(expectedRect.height, 0);
  });

  test("clamps normalized boxes into the 0..1000 range", () => {
    const box = toNormalizedBox(
      { height: 400, width: 400, x: 0, y: 0 },
      200,
      200,
    );

    expect(Math.min(...box)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...box)).toBeLessThanOrEqual(1000);
  });
});

describe("drawn ink detection", () => {
  test("treats empty stroke lists as no ink", () => {
    expect(hasDrawnInk([])).toBe(false);
    expect(hasDrawnInk([[]])).toBe(false);
    expect(hasDrawnInk([SAMPLE_STROKE])).toBe(true);
  });
});

/**
 * Photo sources reject crops whose ink is too dense, because a solid blob is
 * usually a shadow rather than a letter. A drawn straight stroke is legitimately
 * solid, which is why drawn sources trace with trustInk.
 */
describe("why drawn sources bypass the photo ink heuristics", () => {
  test("a straight stroke is denser than the photo ceiling allows", () => {
    const coverage = getInkCoverage(
      createInkImageData(40, 100, (x) => x >= 15 && x <= 24),
    );

    expect(coverage).toBeGreaterThan(MAX_GLYPH_INK_COVERAGE);
  });

  test("a rounded letter stays inside the photo range", () => {
    const center = 20;
    const coverage = getInkCoverage(
      createInkImageData(40, 40, (x, y) => {
        const distance = Math.hypot(x - center, y - center);

        return distance >= 14 && distance <= 18;
      }),
    );

    expect(coverage).toBeGreaterThan(MIN_GLYPH_INK_COVERAGE);
    expect(coverage).toBeLessThan(MAX_GLYPH_INK_COVERAGE);
  });
});

function createInkImageData(
  width: number,
  height: number,
  isInk: (x: number, y: number) => boolean,
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const value = isInk(x, y) ? 17 : 255;

      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }

  return { data, height, width } as ImageData;
}

function getInkCoverage(imageData: ImageData) {
  const bounds = getInkBounds(imageData);

  if (!bounds) {
    throw new Error("Expected ink in the test image.");
  }

  const area =
    (bounds.maxX - bounds.minX + 1) * (bounds.maxY - bounds.minY + 1);

  return countInkPixels(imageData, bounds) / area;
}
