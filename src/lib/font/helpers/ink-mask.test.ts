import { describe, expect, test } from "bun:test";
import { isInkPixel } from "./ink-mask";

describe("ink mask", () => {
  test("detects neutral black marker ink", () => {
    expect(isInkPixel(45, 48, 56)).toBe(true);
  });

  test("keeps warm brown ink support", () => {
    expect(isInkPixel(130, 82, 56)).toBe(true);
  });

  test("ignores plain paper and neutral shadows", () => {
    expect(isInkPixel(218, 214, 204)).toBe(false);
    expect(isInkPixel(160, 160, 160)).toBe(false);
  });
});
