import { describe, expect, test } from "bun:test";
import {
  SUPPORTED_GLYPHS,
  SUPPORTED_LETTERS,
} from "@/lib/extraction/constants";
import { getMissingLetters } from "./glyph-detections";

describe("glyph detections", () => {
  test("tracks missing uppercase and lowercase glyphs", () => {
    expect(getMissingLetters([...SUPPORTED_GLYPHS])).toEqual([]);
    expect(getMissingLetters([...SUPPORTED_LETTERS])).toContain("a");
  });
});
