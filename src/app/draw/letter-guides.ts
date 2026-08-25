/**
 * Guide positions as fractions of the square drawing surface. The ratio between
 * the x-height band and the cap band matches LOWERCASE_SCALE so drawn lowercase
 * letters keep the same proportions the font pipeline expects.
 */
export const GUIDE_POSITIONS = {
  ascender: 0.15,
  baseline: 0.71,
  capHeight: 0.22,
  descender: 0.85,
  xHeight: 0.36,
} as const;

export type GuideName = keyof typeof GUIDE_POSITIONS;

export const GUIDE_LABELS: Record<GuideName, string> = {
  ascender: "asc",
  baseline: "base",
  capHeight: "cap",
  descender: "desc",
  xHeight: "x",
};

const GUIDE_COPY: Record<GuideName, string> = {
  ascender: "ascender line",
  baseline: "baseline",
  capHeight: "cap line",
  descender: "descender line",
  xHeight: "x-height line",
};

const LOWERCASE_ASCENDERS = new Set(["b", "d", "f", "h", "k", "l", "t"]);
const LOWERCASE_DESCENDERS = new Set(["f", "g", "j", "p", "q", "y"]);

export type LetterZone = {
  bottom: GuideName;
  top: GuideName;
};

export function getLetterZone(char: string): LetterZone {
  const isLowercase = char >= "a" && char <= "z";

  if (!isLowercase) {
    return { bottom: "baseline", top: "capHeight" };
  }

  return {
    bottom: LOWERCASE_DESCENDERS.has(char) ? "descender" : "baseline",
    top: LOWERCASE_ASCENDERS.has(char) ? "ascender" : "xHeight",
  };
}

export function getLetterZoneBand(char: string) {
  const zone = getLetterZone(char);

  return {
    bottom: GUIDE_POSITIONS[zone.bottom],
    top: GUIDE_POSITIONS[zone.top],
  };
}

export function getLetterZoneCopy(char: string) {
  const zone = getLetterZone(char);

  return `Sit ${char} between the ${GUIDE_COPY[zone.top]} and the ${GUIDE_COPY[zone.bottom]}.`;
}

export function isZoneGuide(char: string, guide: GuideName) {
  const zone = getLetterZone(char);

  return guide === zone.top || guide === zone.bottom;
}

/**
 * Scales and positions the faded example letter so its ink fills the letter's
 * writing zone exactly, using measured font metrics rather than assumed ones.
 */
export function getGhostLetterLayout({
  band,
  canvasSize,
  measuredAscent,
  measuredDescent,
  trialFontSize,
}: {
  band: { bottom: number; top: number };
  canvasSize: number;
  measuredAscent: number;
  measuredDescent: number;
  trialFontSize: number;
}) {
  const measuredHeight = Math.max(measuredAscent + measuredDescent, 1);
  const targetHeight = (band.bottom - band.top) * canvasSize;
  const scale = targetHeight / measuredHeight;

  return {
    baselineY: band.top * canvasSize + measuredAscent * scale,
    fontSize: trialFontSize * scale,
  };
}
