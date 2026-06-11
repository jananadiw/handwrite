import {
  MAX_STROKE_NORMALIZE_RADIUS,
  TARGET_GLYPH_STROKE_WIDTH,
} from "@/lib/font/constants";
import {
  cloneInkMask,
  emptyInkMask,
} from "./core";
import type { BinaryInkMask } from "./types";

export function normalizeStrokeWeight(
  mask: BinaryInkMask,
  targetStrokeWidth: number = TARGET_GLYPH_STROKE_WIDTH,
) {
  const strokeWidth = estimateStrokeWidth(mask);

  if (!strokeWidth) {
    return cloneInkMask(mask);
  }

  const difference = targetStrokeWidth - strokeWidth;

  if (Math.abs(difference) < 2) {
    return cloneInkMask(mask);
  }

  const radius = Math.min(
    MAX_STROKE_NORMALIZE_RADIUS,
    Math.max(1, Math.round(Math.abs(difference) / 2)),
  );

  return difference > 0 ? dilateInkMask(mask, radius) : erodeInkMask(mask, radius);
}

export function estimateStrokeWidth(mask: BinaryInkMask) {
  const runs: number[] = [];

  for (let y = 0; y < mask.height; y += 1) {
    let runLength = 0;

    for (let x = 0; x < mask.width; x += 1) {
      if (mask.pixels[y * mask.width + x] === 1) {
        runLength += 1;
        continue;
      }

      if (runLength > 0) {
        runs.push(runLength);
        runLength = 0;
      }
    }

    if (runLength > 0) {
      runs.push(runLength);
    }
  }

  if (runs.length === 0) {
    return null;
  }

  runs.sort((left, right) => left - right);

  return runs[Math.floor((runs.length - 1) * 0.35)];
}

function dilateInkMask(mask: BinaryInkMask, radius: number) {
  const nextMask = emptyInkMask(mask.width, mask.height);

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (mask.pixels[y * mask.width + x] !== 1) {
        continue;
      }

      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const nextX = x + offsetX;
          const nextY = y + offsetY;

          if (
            nextX < 0 ||
            nextY < 0 ||
            nextX >= mask.width ||
            nextY >= mask.height
          ) {
            continue;
          }

          nextMask.pixels[nextY * mask.width + nextX] = 1;
        }
      }
    }
  }

  return nextMask;
}

function erodeInkMask(mask: BinaryInkMask, radius: number) {
  const nextMask = emptyInkMask(mask.width, mask.height);

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (mask.pixels[y * mask.width + x] !== 1) {
        continue;
      }

      if (hasInkNeighborhood({ mask, radius, x, y })) {
        nextMask.pixels[y * mask.width + x] = 1;
      }
    }
  }

  return nextMask;
}

function hasInkNeighborhood({
  mask,
  radius,
  x,
  y,
}: {
  mask: BinaryInkMask;
  radius: number;
  x: number;
  y: number;
}) {
  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      const nextX = x + offsetX;
      const nextY = y + offsetY;

      if (
        nextX < 0 ||
        nextY < 0 ||
        nextX >= mask.width ||
        nextY >= mask.height
      ) {
        return false;
      }

      if (mask.pixels[nextY * mask.width + nextX] !== 1) {
        return false;
      }
    }
  }

  return true;
}
