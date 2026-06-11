import { describe, expect, test } from "bun:test";
import {
  countInkMaskPixels,
  estimateStrokeWidth,
  getInkMaskBounds,
  normalizeStrokeWeight,
  preprocessInkMask,
  removeDetachedInk,
  resizeInkMaskToHeight,
  type BinaryInkMask,
  isInkPixel,
} from "./ink-mask";

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

  test("removes small detached specks", () => {
    const mask = maskFromRows([
      "###....",
      "###....",
      "###....",
      ".......",
      "......#",
    ]);

    const cleanedMask = removeDetachedInk(mask, "A");

    expect(countInkMaskPixels(cleanedMask)).toBe(9);
    expect(getInkMaskBounds(cleanedMask)).toEqual({
      minX: 0,
      minY: 0,
      maxX: 2,
      maxY: 2,
    });
  });

  test("preserves meaningful lowercase i dots", () => {
    const mask = maskFromRows([
      ".##.",
      "....",
      ".##.",
      ".##.",
      ".##.",
      ".##.",
    ]);

    expect(countInkMaskPixels(removeDetachedInk(mask, "l"))).toBe(8);
    expect(countInkMaskPixels(removeDetachedInk(mask, "i"))).toBe(10);
  });

  test("normalizes uppercase masks to cap height", () => {
    const imageData = imageDataFromRows([
      ".##.",
      ".##.",
      ".##.",
      ".##.",
      ".##.",
    ]);

    const processedMask = preprocessInkMask({
      bounds: {
        minX: 0,
        minY: 0,
        maxX: imageData.width - 1,
        maxY: imageData.height - 1,
      },
      char: "A",
      imageData,
    });

    expect(processedMask?.height).toBe(700);
  });

  test("normalizes lowercase masks to x-height", () => {
    const imageData = imageDataFromRows([
      ".##.",
      ".##.",
      ".##.",
      ".##.",
      ".##.",
    ]);

    const processedMask = preprocessInkMask({
      bounds: {
        minX: 0,
        minY: 0,
        maxX: imageData.width - 1,
        maxY: imageData.height - 1,
      },
      char: "a",
      imageData,
    });

    expect(processedMask?.height).toBe(504);
  });

  test("resizes masks proportionally to a target height", () => {
    const resizedMask = resizeInkMaskToHeight(
      maskFromRows(["##########", "##########"]),
      10,
    );

    expect(resizedMask.height).toBe(10);
    expect(resizedMask.width).toBe(50);
  });

  test("moves thin and thick strokes toward one target thickness", () => {
    const thinMask = normalizeStrokeWeight(
      maskFromRows([
        ".....#.....",
        ".....#.....",
        ".....#.....",
        ".....#.....",
        ".....#.....",
        ".....#.....",
        ".....#.....",
      ]),
      5,
    );
    const thickMask = normalizeStrokeWeight(
      maskFromRows([
        ".#########.",
        ".#########.",
        ".#########.",
        ".#########.",
        ".#########.",
        ".#########.",
        ".#########.",
      ]),
      5,
    );

    expect(estimateStrokeWidth(thinMask)).toBe(5);
    expect(estimateStrokeWidth(thickMask)).toBe(5);
  });
});

function maskFromRows(rows: string[]): BinaryInkMask {
  const height = rows.length;
  const width = Math.max(...rows.map((row) => row.length));
  const pixels = new Uint8Array(width * height);

  rows.forEach((row, y) => {
    for (let x = 0; x < width; x += 1) {
      pixels[y * width + x] = row[x] === "#" ? 1 : 0;
    }
  });

  return { height, pixels, width };
}

function imageDataFromRows(rows: string[]) {
  const height = rows.length;
  const width = Math.max(...rows.map((row) => row.length));
  const data = new Uint8ClampedArray(width * height * 4);

  rows.forEach((row, y) => {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const color = row[x] === "#" ? 0 : 255;

      data[offset] = color;
      data[offset + 1] = color;
      data[offset + 2] = color;
      data[offset + 3] = 255;
    }
  });

  return { data, height, width } as ImageData;
}
