import { GLYPH_PADDING_RATIO } from "@/lib/font/constants";
import type { PixelRect } from "@/lib/extraction/schemas";
import type { Bounds } from "@/lib/font/types";
import type { BinaryInkMask } from "./types";

export function createInkMask(imageData: ImageData, bounds?: Bounds) {
  const sourceBounds = bounds ?? {
    minX: 0,
    minY: 0,
    maxX: imageData.width - 1,
    maxY: imageData.height - 1,
  };
  const width = Math.max(1, sourceBounds.maxX - sourceBounds.minX + 1);
  const height = Math.max(1, sourceBounds.maxY - sourceBounds.minY + 1);
  const mask = emptyInkMask(width, height);
  const pixels = imageData.data;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceX = sourceBounds.minX + x;
      const sourceY = sourceBounds.minY + y;
      const sourceOffset = (sourceY * imageData.width + sourceX) * 4;

      mask.pixels[y * width + x] = isInkPixel(
        pixels[sourceOffset],
        pixels[sourceOffset + 1],
        pixels[sourceOffset + 2],
      )
        ? 1
        : 0;
    }
  }

  return mask;
}

export function getInkMaskBounds(mask: BinaryInkMask): Bounds | null {
  const bounds: Bounds = {
    minX: mask.width,
    minY: mask.height,
    maxX: 0,
    maxY: 0,
  };
  let hasInk = false;

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (mask.pixels[y * mask.width + x] !== 1) {
        continue;
      }

      hasInk = true;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }

  return hasInk ? bounds : null;
}

export function countInkMaskPixels(mask: BinaryInkMask, bounds?: Bounds) {
  const sourceBounds = bounds ?? {
    minX: 0,
    minY: 0,
    maxX: mask.width - 1,
    maxY: mask.height - 1,
  };
  let inkPixels = 0;

  for (let y = sourceBounds.minY; y <= sourceBounds.maxY; y += 1) {
    for (let x = sourceBounds.minX; x <= sourceBounds.maxX; x += 1) {
      if (mask.pixels[y * mask.width + x] === 1) {
        inkPixels += 1;
      }
    }
  }

  return inkPixels;
}

export function cropInkMask(mask: BinaryInkMask, bounds: Bounds) {
  const width = Math.max(1, bounds.maxX - bounds.minX + 1);
  const height = Math.max(1, bounds.maxY - bounds.minY + 1);
  const nextMask = emptyInkMask(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      nextMask.pixels[y * width + x] =
        mask.pixels[(bounds.minY + y) * mask.width + bounds.minX + x];
    }
  }

  return nextMask;
}

export function getInkBounds(imageData: ImageData): Bounds | null {
  const pixels = imageData.data;
  const bounds: Bounds = {
    minX: imageData.width,
    minY: imageData.height,
    maxX: 0,
    maxY: 0,
  };
  let hasInk = false;

  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const offset = (y * imageData.width + x) * 4;

      if (!isInkPixel(pixels[offset], pixels[offset + 1], pixels[offset + 2])) {
        continue;
      }

      hasInk = true;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }

  return hasInk ? bounds : null;
}

export function countInkPixels(imageData: ImageData, bounds: Bounds) {
  const pixels = imageData.data;
  let inkPixels = 0;

  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const offset = (y * imageData.width + x) * 4;

      if (!isInkPixel(pixels[offset], pixels[offset + 1], pixels[offset + 2])) {
        continue;
      }

      inkPixels += 1;
    }
  }

  return inkPixels;
}

export function padPixelRect(
  rect: PixelRect,
  imageWidth: number,
  imageHeight: number,
): PixelRect {
  const horizontalPadding = Math.round(rect.width * GLYPH_PADDING_RATIO);
  const verticalPadding = Math.round(rect.height * GLYPH_PADDING_RATIO);
  const x = Math.max(0, rect.x - horizontalPadding);
  const y = Math.max(0, rect.y - verticalPadding);
  const maxX = Math.min(imageWidth, rect.x + rect.width + horizontalPadding);
  const maxY = Math.min(imageHeight, rect.y + rect.height + verticalPadding);

  return {
    x,
    y,
    width: Math.max(1, maxX - x),
    height: Math.max(1, maxY - y),
  };
}

export function isInkPixel(red: number, green: number, blue: number) {
  const lightness = (red + green + blue) / 3;
  const warmth = red - blue;
  const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);

  if (lightness < 145) {
    return true;
  }

  return lightness < 185 && warmth > 8 && saturation > 14;
}

export function cloneInkMask(mask: BinaryInkMask) {
  return {
    height: mask.height,
    pixels: Uint8Array.from(mask.pixels),
    width: mask.width,
  };
}

export function emptyInkMask(width: number, height: number): BinaryInkMask {
  return {
    height,
    pixels: new Uint8Array(width * height),
    width,
  };
}
