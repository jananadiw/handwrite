import { SUPPORTED_GLYPHS } from "@/lib/extraction/constants";

export function getMissingLetters(generatedLetters: string[]) {
  const generated = new Set(generatedLetters);

  return SUPPORTED_GLYPHS.filter((letter) => !generated.has(letter));
}
