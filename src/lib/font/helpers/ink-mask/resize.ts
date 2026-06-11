import { MIN_GLYPH_PIXELS } from "@/lib/font/constants";
import { emptyInkMask } from "./core";
import type { BinaryInkMask } from "./types";

export function resizeInkMaskToHeight(
  mask: BinaryInkMask,
  targetHeight: number,
) {
  const height = Math.max(1, Math.round(targetHeight));
  const width = Math.max(
    MIN_GLYPH_PIXELS,
    Math.round((mask.width / Math.max(mask.height, 1)) * height),
  );
  const nextMask = emptyInkMask(width, height);

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(
      mask.height - 1,
      Math.floor((y / height) * mask.height),
    );

    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(
        mask.width - 1,
        Math.floor((x / width) * mask.width),
      );

      nextMask.pixels[y * width + x] =
        mask.pixels[sourceY * mask.width + sourceX];
    }
  }

  return nextMask;
}
