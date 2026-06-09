import ImageTracer from "imagetracerjs";
import * as opentype from "opentype.js";
import { DEFAULT_FONT_METRICS } from "@/lib/extraction/constants";
import {
  normalizedBoxToPixelRect,
  type LetterDetection,
} from "@/lib/extraction/schemas";
import { IMAGE_TRACE_OPTIONS, LOWERCASE_SCALE } from "@/lib/font/constants";
import { createMaskCanvas, getInkBounds, padPixelRect } from "./ink-mask";
import { getInkPathData, pathFromSvg, transformPath } from "./svg-paths";

export function traceGlyph({
  detection,
  imageBitmap,
  imageHeight,
  imageWidth,
}: {
  detection: LetterDetection;
  imageBitmap: ImageBitmap;
  imageHeight: number;
  imageWidth: number;
}) {
  const sourceCanvas = createSourceCanvas({
    detection,
    imageBitmap,
    imageHeight,
    imageWidth,
  });
  const sourceContext = getCanvasContext(sourceCanvas);
  const sourceImageData = sourceContext.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  );
  const inkBounds = getInkBounds(sourceImageData);

  if (!inkBounds) {
    return null;
  }

  const maskCanvas = createMaskCanvas(sourceCanvas, inkBounds);
  const maskContext = getCanvasContext(maskCanvas);
  const svg = ImageTracer.imagedataToSVG(
    maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height),
    IMAGE_TRACE_OPTIONS,
  );
  const pathData = getInkPathData(svg);

  if (!pathData) {
    return null;
  }

  const scale =
    DEFAULT_FONT_METRICS.capHeight / Math.max(maskCanvas.height, 1);
  const path = pathFromSvg(pathData, {
    flipY: true,
    flipYBase: maskCanvas.height,
    scale,
    x: DEFAULT_FONT_METRICS.sideBearing,
    y: 0,
  });
  const advanceWidth = Math.max(
    DEFAULT_FONT_METRICS.unitsPerEm / 2,
    Math.round(maskCanvas.width * scale + DEFAULT_FONT_METRICS.sideBearing * 2),
  );

  return new opentype.Glyph({
    name: detection.char,
    unicode: detection.char.charCodeAt(0),
    advanceWidth,
    path,
  });
}

export function createLowercaseGlyph(
  uppercaseLetter: string,
  uppercasePath: opentype.Path,
  uppercaseAdvanceWidth: number = DEFAULT_FONT_METRICS.unitsPerEm,
) {
  return new opentype.Glyph({
    name: uppercaseLetter.toLowerCase(),
    unicode: uppercaseLetter.toLowerCase().charCodeAt(0),
    advanceWidth: Math.round(uppercaseAdvanceWidth * LOWERCASE_SCALE),
    path: transformPath(uppercasePath, {
      scaleX: LOWERCASE_SCALE,
      scaleY: LOWERCASE_SCALE,
      translateX: 0,
      translateY: 0,
    }),
  });
}

export function createEmptyGlyph({
  advanceWidth = DEFAULT_FONT_METRICS.unitsPerEm,
  name,
  unicode,
}: {
  advanceWidth?: number;
  name: string;
  unicode?: number;
}) {
  return new opentype.Glyph({
    advanceWidth,
    name,
    path: new opentype.Path(),
    unicode,
  });
}

function createSourceCanvas({
  detection,
  imageBitmap,
  imageHeight,
  imageWidth,
}: {
  detection: LetterDetection;
  imageBitmap: ImageBitmap;
  imageHeight: number;
  imageWidth: number;
}) {
  const sourceRect = padPixelRect(
    normalizedBoxToPixelRect({
      box: detection.box,
      imageHeight,
      imageWidth,
    }),
    imageWidth,
    imageHeight,
  );
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = sourceRect.width;
  sourceCanvas.height = sourceRect.height;

  getCanvasContext(sourceCanvas).drawImage(
    imageBitmap,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    sourceRect.width,
    sourceRect.height,
  );

  return sourceCanvas;
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas is unavailable.");
  }

  return context;
}
