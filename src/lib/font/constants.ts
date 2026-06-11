export const FONT_FAMILY_NAME = "Handwrite Generated";
export const FONT_FILE_NAME = "handwrite-generated.ttf";
export const FONT_MIME_TYPE = "font/ttf";

export const GLYPH_PADDING_RATIO = 0.28;
export const MIN_GLYPH_PIXELS = 24;
export const MIN_GLYPH_INK_PIXELS = 80;
export const MIN_GLYPH_INK_COVERAGE = 0.015;
export const MAX_GLYPH_INK_COVERAGE = 0.68;
export const LOWERCASE_SCALE = 0.72;
export const NOISE_COMPONENT_MIN_PIXELS = 3;
export const NOISE_COMPONENT_AREA_RATIO = 0.01;
export const DOT_COMPONENT_MIN_PIXELS = 2;
export const TARGET_GLYPH_STROKE_WIDTH = 42;
export const MAX_STROKE_NORMALIZE_RADIUS = 3;

export const IMAGE_TRACE_OPTIONS = {
  colorsampling: 0,
  numberofcolors: 2,
  pathomit: 3,
  ltres: 0.7,
  qtres: 0.7,
  roundcoords: 1,
  scale: 1,
  strokewidth: 0,
} as const;
