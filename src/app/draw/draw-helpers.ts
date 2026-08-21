import { SUPPORTED_GLYPHS } from "@/lib/extraction/constants";
import {
  hasDrawnInk,
  type DrawnChar,
  type DrawnGlyph,
  type DrawnStroke,
} from "@/lib/font/drawn-glyphs";

export type DrawnStrokesByChar = Partial<Record<DrawnChar, DrawnStroke[]>>;

export type DrawnStatus = "drawing" | "generating" | "generated" | "error";

export function getDrawnChars(strokesByChar: DrawnStrokesByChar) {
  return SUPPORTED_GLYPHS.filter((char) =>
    hasDrawnInk(strokesByChar[char] ?? []),
  );
}

export function buildDrawnGlyphs(
  strokesByChar: DrawnStrokesByChar,
): DrawnGlyph[] {
  return getDrawnChars(strokesByChar).map((char) => ({
    char,
    strokes: strokesByChar[char] ?? [],
  }));
}

export function getNextUndrawnChar(
  strokesByChar: DrawnStrokesByChar,
  currentChar: DrawnChar,
): DrawnChar {
  const startIndex = SUPPORTED_GLYPHS.indexOf(currentChar);

  for (let offset = 1; offset <= SUPPORTED_GLYPHS.length; offset += 1) {
    const candidate =
      SUPPORTED_GLYPHS[(startIndex + offset) % SUPPORTED_GLYPHS.length];

    if (!hasDrawnInk(strokesByChar[candidate] ?? [])) {
      return candidate;
    }
  }

  return currentChar;
}

export function getDrawProgressLine(strokesByChar: DrawnStrokesByChar) {
  const drawnCount = getDrawnChars(strokesByChar).length;

  return `${drawnCount} of ${SUPPORTED_GLYPHS.length} letters drawn`;
}

export function getDrawHeaderCopy(status: DrawnStatus) {
  if (status === "generated") {
    return {
      subtitle: "Preview it, then download.",
      title: "Your font, made by you",
    };
  }

  return {
    subtitle: "Draw a few letters with your finger, stylus, or trackpad.",
    title: "Write your letters",
  };
}

export function canGenerateDrawnFont(
  strokesByChar: DrawnStrokesByChar,
  status: DrawnStatus,
) {
  return status !== "generating" && getDrawnChars(strokesByChar).length > 0;
}
