import { NORMALIZED_COORDINATE_MAX } from "@/lib/extraction/constants";
import type {
  AlphabetAnalysis,
  LetterDetection,
  NormalizedBox,
  PixelRect,
} from "@/lib/extraction/schemas";
import {
  createFontCanvas,
  fontCanvasToBlob,
  getFontCanvasContext,
  type FontCanvasContext,
} from "@/lib/font/helpers/canvas";
import type { HandwritingFontSource } from "@/lib/font/types";

export const DRAWN_CELL_SIZE = 256;
export const DRAWN_GRID_COLUMNS = 8;
export const DRAWN_CELL_INSET_RATIO = 0.2;
export const DRAWN_STROKE_WIDTH_RATIO = 0.055;
export const DRAWN_PRESSURE_WIDTH_RANGE = 0.5;

export type DrawnChar = LetterDetection["char"];

export type DrawnPoint = {
  pressure: number;
  x: number;
  y: number;
};

export type DrawnStroke = DrawnPoint[];

export type DrawnGlyph = {
  char: DrawnChar;
  strokes: DrawnStroke[];
};

export type DrawnGridLayout = {
  columns: number;
  height: number;
  rows: number;
  width: number;
};

export function getDrawnGridLayout(glyphCount: number): DrawnGridLayout {
  const columns = Math.min(DRAWN_GRID_COLUMNS, Math.max(1, glyphCount));
  const rows = Math.max(1, Math.ceil(Math.max(1, glyphCount) / columns));

  return {
    columns,
    height: rows * DRAWN_CELL_SIZE,
    rows,
    width: columns * DRAWN_CELL_SIZE,
  };
}

/**
 * Ink is inset inside each cell so the pipeline's glyph padding can expand a
 * detection box without reaching a neighbouring cell.
 */
export function getDrawnCellRect(index: number, columns: number): PixelRect {
  const inset = DRAWN_CELL_SIZE * DRAWN_CELL_INSET_RATIO;

  return {
    height: DRAWN_CELL_SIZE - inset * 2,
    width: DRAWN_CELL_SIZE - inset * 2,
    x: (index % columns) * DRAWN_CELL_SIZE + inset,
    y: Math.floor(index / columns) * DRAWN_CELL_SIZE + inset,
  };
}

export function toNormalizedBox(
  rect: PixelRect,
  canvasWidth: number,
  canvasHeight: number,
): NormalizedBox {
  const scaleX = NORMALIZED_COORDINATE_MAX / Math.max(canvasWidth, 1);
  const scaleY = NORMALIZED_COORDINATE_MAX / Math.max(canvasHeight, 1);

  return [
    clampNormalized(rect.y * scaleY),
    clampNormalized(rect.x * scaleX),
    clampNormalized((rect.y + rect.height) * scaleY),
    clampNormalized((rect.x + rect.width) * scaleX),
  ];
}

export function hasDrawnInk(strokes: DrawnStroke[]) {
  return strokes.some((stroke) => stroke.length > 0);
}

export function createDrawnAnalysis(
  glyphs: DrawnGlyph[],
  layout: DrawnGridLayout,
): AlphabetAnalysis {
  return {
    globalIssues: [],
    letters: glyphs.map((glyph, index) => ({
      box: toNormalizedBox(
        getDrawnCellRect(index, layout.columns),
        layout.width,
        layout.height,
      ),
      char: glyph.char,
      confidence: 1,
      issues: [],
    })),
    orientationDegrees: 0,
    source: "alphabet",
    usable: true,
  };
}

export function renderDrawnGlyphs(glyphs: DrawnGlyph[]) {
  const layout = getDrawnGridLayout(glyphs.length);
  const canvas = createFontCanvas(layout.width, layout.height);
  const context = getFontCanvasContext(canvas);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, layout.width, layout.height);
  context.fillStyle = "#111111";
  context.strokeStyle = "#111111";
  context.lineCap = "round";
  context.lineJoin = "round";

  glyphs.forEach((glyph, index) => {
    const cellRect = getDrawnCellRect(index, layout.columns);

    for (const stroke of glyph.strokes) {
      paintDrawnStroke({ context, rect: cellRect, stroke });
    }
  });

  return { canvas, layout };
}

export async function createDrawnFontSource(
  glyphs: DrawnGlyph[],
): Promise<HandwritingFontSource> {
  if (glyphs.length === 0) {
    throw new Error("Draw at least one letter before generating a font.");
  }

  const { canvas, layout } = renderDrawnGlyphs(glyphs);

  return {
    analysis: createDrawnAnalysis(glyphs, layout),
    height: layout.height,
    kind: "drawn",
    photo: await fontCanvasToBlob(canvas),
    width: layout.width,
  };
}

/**
 * Paints one stroke into a rect. Stroke width scales with the rect so the live
 * drawing surface and the composed sheet produce the same letter proportions.
 */
export function paintDrawnStroke({
  context,
  rect,
  stroke,
}: {
  context: FontCanvasContext;
  rect: PixelRect;
  stroke: DrawnStroke;
}) {
  if (stroke.length === 0) {
    return;
  }

  const baseWidth = rect.width * DRAWN_STROKE_WIDTH_RATIO;
  const toCanvasPoint = (point: DrawnPoint) => ({
    x: rect.x + point.x * rect.width,
    y: rect.y + point.y * rect.height,
  });

  if (stroke.length === 1) {
    const point = toCanvasPoint(stroke[0]);

    context.beginPath();
    context.arc(
      point.x,
      point.y,
      (baseWidth * getPressureScale(stroke[0].pressure)) / 2,
      0,
      Math.PI * 2,
    );
    context.fill();

    return;
  }

  for (let index = 1; index < stroke.length; index += 1) {
    const from = toCanvasPoint(stroke[index - 1]);
    const to = toCanvasPoint(stroke[index]);
    const pressure =
      (stroke[index - 1].pressure + stroke[index].pressure) / 2;

    context.lineWidth = baseWidth * getPressureScale(pressure);
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }
}

function getPressureScale(pressure: number) {
  const safePressure = Number.isFinite(pressure)
    ? Math.min(1, Math.max(0, pressure))
    : 0.5;

  return (
    1 - DRAWN_PRESSURE_WIDTH_RANGE / 2 + safePressure * DRAWN_PRESSURE_WIDTH_RANGE
  );
}

function clampNormalized(value: number) {
  return Math.min(
    NORMALIZED_COORDINATE_MAX,
    Math.max(0, Math.round(value)),
  );
}
