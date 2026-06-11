import { DEFAULT_FONT_METRICS } from "@/lib/extraction/constants";
import { LOWERCASE_SCALE } from "@/lib/font/constants";
import type { Bounds } from "@/lib/font/types";
import {
  createInkMask,
  cropInkMask,
  getInkMaskBounds,
} from "./core";
import { removeDetachedInk } from "./components";
import { resizeInkMaskToHeight } from "./resize";
import { normalizeStrokeWeight } from "./strokes";

export function preprocessInkMask({
  bounds,
  char,
  imageData,
}: {
  bounds: Bounds;
  char: string;
  imageData: ImageData;
}) {
  const targetHeight = getGlyphTargetMaskHeight(char);
  let mask = createInkMask(imageData, bounds);

  mask = removeDetachedInk(mask, char);

  const cleanedBounds = getInkMaskBounds(mask);

  if (!cleanedBounds) {
    return null;
  }

  mask = cropInkMask(mask, cleanedBounds);
  mask = resizeInkMaskToHeight(mask, targetHeight);
  mask = normalizeStrokeWeight(mask);

  const normalizedBounds = getInkMaskBounds(mask);

  if (!normalizedBounds) {
    return null;
  }

  return resizeInkMaskToHeight(cropInkMask(mask, normalizedBounds), targetHeight);
}

export function getGlyphTargetMaskHeight(char: string) {
  if (char >= "a" && char <= "z") {
    return Math.round(DEFAULT_FONT_METRICS.capHeight * LOWERCASE_SCALE);
  }

  return DEFAULT_FONT_METRICS.capHeight;
}
