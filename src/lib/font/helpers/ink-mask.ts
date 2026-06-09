import { GLYPH_PADDING_RATIO, MIN_GLYPH_PIXELS } from "@/lib/font/constants";
import type { Bounds } from "@/lib/font/types";
import type { PixelRect } from "@/lib/extraction/schemas";

export function createMaskCanvas(sourceCanvas: HTMLCanvasElement, bounds: Bounds) {
  const width = Math.max(MIN_GLYPH_PIXELS, bounds.maxX - bounds.minX + 1);
  const height = Math.max(MIN_GLYPH_PIXELS, bounds.maxY - bounds.minY + 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas is unavailable.");
  }

  context.drawImage(
    sourceCanvas,
    bounds.minX,
    bounds.minY,
    bounds.maxX - bounds.minX + 1,
    bounds.maxY - bounds.minY + 1,
    0,
    0,
    width,
    height,
  );

  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const isInk = isInkPixel(pixels[index], pixels[index + 1], pixels[index + 2]);
    pixels[index] = isInk ? 0 : 255;
    pixels[index + 1] = isInk ? 0 : 255;
    pixels[index + 2] = isInk ? 0 : 255;
    pixels[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);

  return canvas;
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

function isInkPixel(red: number, green: number, blue: number) {
  const lightness = (red + green + blue) / 3;
  const warmth = red - blue;
  const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);

  return lightness < 185 && warmth > 8 && saturation > 14;
}
