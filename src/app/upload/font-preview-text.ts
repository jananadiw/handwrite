import { SUPPORTED_GLYPHS } from "@/lib/extraction/constants";

export const DEFAULT_PREVIEW_TEXT = "Handwrite";
export const PREVIEW_TEXT_MAX_LENGTH = 32;

/** A pangram, so a complete font renders every sample letter from its own glyphs. */
export const SPACING_PREVIEW_TEXT =
  "The quick brown fox jumps over the lazy dog";

const SPACING_SAMPLE_CHUNK_SIZE = 6;
const SPACING_SAMPLE_MIN_LETTERS = 4;

export function normalisePreviewText(value: string) {
  return value.replace(/\s+/g, " ").slice(0, PREVIEW_TEXT_MAX_LENGTH);
}

export function getPreviewDisplayText(value: string) {
  return value.trim().length > 0 ? value : DEFAULT_PREVIEW_TEXT;
}

export function getUnsupportedPreviewCharacters(
  text: string,
  generatedLetters: string[],
) {
  const availableCharacters = new Set(generatedLetters);
  const unsupported: string[] = [];

  for (const character of text) {
    if (
      character === " " ||
      availableCharacters.has(character) ||
      unsupported.includes(character)
    ) {
      continue;
    }

    unsupported.push(character);
  }

  return unsupported;
}

export function getPreviewFallbackNotice(unsupportedCharacters: string[]) {
  if (unsupportedCharacters.length === 0) {
    return null;
  }

  return `Not in your font yet: ${unsupportedCharacters.join(" ")} — these fall back to another typeface.`;
}

/**
 * Letter spacing only moves glyphs the font contains, so an incomplete font must
 * preview its own letters. Sampling the pangram instead would fill the panel with
 * fallback text that ignores every spacing change.
 */
export function getSpacingPreview(generatedLetters: string[]) {
  const availableLetters = SUPPORTED_GLYPHS.filter((glyph) =>
    generatedLetters.includes(glyph),
  );
  const coversPangram =
    getUnsupportedPreviewCharacters(SPACING_PREVIEW_TEXT, generatedLetters)
      .length === 0;

  if (coversPangram || availableLetters.length === 0) {
    return { notice: null, text: SPACING_PREVIEW_TEXT };
  }

  return {
    notice: `Previewing the ${availableLetters.length} ${
      availableLetters.length === 1 ? "letter" : "letters"
    } in your font — spacing only moves these.`,
    text: groupLettersIntoSample(availableLetters),
  };
}

function groupLettersIntoSample(letters: readonly string[]) {
  const sample = [...letters];

  // Spacing is only visible between adjacent letters, so a font with one or two
  // glyphs repeats them rather than showing a sample nothing can move.
  while (sample.length < SPACING_SAMPLE_MIN_LETTERS) {
    sample.push(...letters);
  }

  const groups: string[] = [];

  for (
    let index = 0;
    index < sample.length;
    index += SPACING_SAMPLE_CHUNK_SIZE
  ) {
    groups.push(sample.slice(index, index + SPACING_SAMPLE_CHUNK_SIZE).join(""));
  }

  return groups.join(" ");
}
