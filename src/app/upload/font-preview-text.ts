export const DEFAULT_PREVIEW_TEXT = "Handwrite";
export const PREVIEW_TEXT_MAX_LENGTH = 32;

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
