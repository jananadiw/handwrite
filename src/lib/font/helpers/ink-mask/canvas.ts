import {
  createFontCanvas,
  getFontCanvasContext,
} from "../canvas";
import type { BinaryInkMask } from "./types";

export function createMaskCanvasFromInkMask(mask: BinaryInkMask) {
  const canvas = createFontCanvas(mask.width, mask.height);
  const context = getFontCanvasContext(canvas);
  const imageData = context.createImageData(mask.width, mask.height);
  const pixels = imageData.data;

  for (let index = 0; index < mask.pixels.length; index += 1) {
    const pixelOffset = index * 4;
    const isInk = mask.pixels[index] === 1;

    pixels[pixelOffset] = isInk ? 0 : 255;
    pixels[pixelOffset + 1] = isInk ? 0 : 255;
    pixels[pixelOffset + 2] = isInk ? 0 : 255;
    pixels[pixelOffset + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);

  return canvas;
}
