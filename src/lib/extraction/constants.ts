export const SUPPORTED_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

export const SUPPORTED_LOWERCASE_LETTERS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
] as const;

export const SUPPORTED_GLYPHS = [
  ...SUPPORTED_LETTERS,
  ...SUPPORTED_LOWERCASE_LETTERS,
] as const;

export const GEMINI_ANALYSIS_MODEL = "gemini-3.5-flash";

export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const MAX_ANALYSIS_IMAGE_BYTES = 5 * 1024 * 1024;

export const NORMALIZED_COORDINATE_MAX = 1000;

export const DEFAULT_FONT_METRICS = {
  unitsPerEm: 1000,
  capHeight: 700,
  ascender: 800,
  descender: -200,
  sideBearing: 60,
} as const;
