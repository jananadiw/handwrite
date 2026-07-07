import {
  NORMALIZED_COORDINATE_MAX,
  type SUPPORTED_GLYPHS,
} from "@/lib/extraction/constants";
import type { AlphabetAnalysis, NormalizedBox } from "./schemas";

type GlyphChar = (typeof SUPPORTED_GLYPHS)[number];

const SOURCE_WIDTH = 1956;
const SOURCE_HEIGHT = 1355;

type PixelGlyph = {
  char: GlyphChar;
  confidence: number;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

const pixelGlyphs: PixelGlyph[] = [
  { char: "H", confidence: 0.91, rect: { x: 695, y: 705, width: 125, height: 95 } },
  { char: "W", confidence: 0.86, rect: { x: 620, y: 1195, width: 86, height: 80 } },
  { char: "a", confidence: 0.95, rect: { x: 880, y: 742, width: 46, height: 60 } },
  { char: "b", confidence: 0.82, rect: { x: 1370, y: 389, width: 42, height: 96 } },
  { char: "c", confidence: 0.9, rect: { x: 1015, y: 415, width: 42, height: 54 } },
  { char: "d", confidence: 0.95, rect: { x: 1085, y: 715, width: 52, height: 91 } },
  { char: "e", confidence: 0.96, rect: { x: 817, y: 742, width: 37, height: 52 } },
  { char: "f", confidence: 0.9, rect: { x: 1552, y: 388, width: 48, height: 98 } },
  { char: "g", confidence: 0.89, rect: { x: 615, y: 242, width: 48, height: 86 } },
  { char: "h", confidence: 0.95, rect: { x: 842, y: 728, width: 52, height: 74 } },
  { char: "i", confidence: 0.93, rect: { x: 795, y: 385, width: 34, height: 76 } },
  { char: "j", confidence: 0.83, rect: { x: 790, y: 0, width: 72, height: 84 } },
  { char: "k", confidence: 0.88, rect: { x: 590, y: 805, width: 45, height: 77 } },
  { char: "l", confidence: 0.93, rect: { x: 979, y: 708, width: 38, height: 94 } },
  { char: "m", confidence: 0.92, rect: { x: 885, y: 403, width: 90, height: 62 } },
  { char: "n", confidence: 0.95, rect: { x: 1040, y: 742, width: 50, height: 58 } },
  { char: "o", confidence: 0.94, rect: { x: 1230, y: 742, width: 47, height: 54 } },
  { char: "p", confidence: 0.88, rect: { x: 950, y: 728, width: 42, height: 90 } },
  { char: "r", confidence: 0.93, rect: { x: 1150, y: 735, width: 48, height: 62 } },
  { char: "s", confidence: 0.94, rect: { x: 918, y: 744, width: 44, height: 56 } },
  { char: "t", confidence: 0.95, rect: { x: 734, y: 627, width: 46, height: 83 } },
  { char: "u", confidence: 0.94, rect: { x: 1010, y: 743, width: 45, height: 58 } },
  { char: "v", confidence: 0.9, rect: { x: 1325, y: 742, width: 48, height: 65 } },
  { char: "w", confidence: 0.89, rect: { x: 494, y: 804, width: 61, height: 72 } },
  { char: "y", confidence: 0.86, rect: { x: 1490, y: 820, width: 48, height: 95 } },
];

export const declarationDemoAnalysis: AlphabetAnalysis = {
  source: "declaration-demo",
  usable: true,
  orientationDegrees: 0,
  letters: pixelGlyphs.map((glyph) => ({
    char: glyph.char,
    box: toNormalizedBox(glyph.rect),
    confidence: glyph.confidence,
    issues: [],
  })),
  globalIssues: [],
};

function toNormalizedBox({
  x,
  y,
  width,
  height,
}: PixelGlyph["rect"]): NormalizedBox {
  return [
    normalize(y, SOURCE_HEIGHT),
    normalize(x, SOURCE_WIDTH),
    normalize(y + height, SOURCE_HEIGHT),
    normalize(x + width, SOURCE_WIDTH),
  ];
}

function normalize(value: number, sourceMax: number) {
  return Math.round((value / sourceMax) * NORMALIZED_COORDINATE_MAX);
}
