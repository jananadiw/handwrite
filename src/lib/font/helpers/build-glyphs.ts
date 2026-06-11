import ImageTracer from "imagetracerjs";
import * as opentype from "opentype.js";
import { DEFAULT_FONT_METRICS } from "@/lib/extraction/constants";
import {
  normalizedBoxToPixelRect,
  type LetterDetection,
} from "@/lib/extraction/schemas";
import {
  IMAGE_TRACE_OPTIONS,
  LOWERCASE_SCALE,
  MAX_GLYPH_INK_COVERAGE,
  MIN_GLYPH_INK_COVERAGE,
  MIN_GLYPH_INK_PIXELS,
} from "@/lib/font/constants";
import {
  createFontCanvas,
  getFontCanvasContext,
} from "./canvas";
import {
  countInkPixels,
  createMaskCanvasFromInkMask,
  getInkBounds,
  padPixelRect,
  preprocessInkMask,
} from "./ink-mask";
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
  const sourceContext = getFontCanvasContext(sourceCanvas);
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

  const inkPixels = countInkPixels(sourceImageData, inkBounds);
  const inkArea =
    (inkBounds.maxX - inkBounds.minX + 1) *
    (inkBounds.maxY - inkBounds.minY + 1);
  const inkCoverage = inkPixels / Math.max(inkArea, 1);

  if (
    inkPixels < MIN_GLYPH_INK_PIXELS ||
    inkCoverage < MIN_GLYPH_INK_COVERAGE ||
    inkCoverage > MAX_GLYPH_INK_COVERAGE
  ) {
    return null;
  }

  const processedMask = preprocessInkMask({
    bounds: inkBounds,
    char: detection.char,
    imageData: sourceImageData,
  });

  if (!processedMask) {
    return null;
  }

  const maskCanvas = createMaskCanvasFromInkMask(processedMask);
  const maskContext = getFontCanvasContext(maskCanvas);
  const svg = ImageTracer.imagedataToSVG(
    maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height),
    IMAGE_TRACE_OPTIONS,
  );
  const pathData = getInkPathData(svg);

  if (!pathData) {
    return null;
  }

  const path = pathFromSvg(pathData, {
    flipY: true,
    flipYBase: maskCanvas.height,
    scale: 1,
    x: DEFAULT_FONT_METRICS.sideBearing,
    y: 0,
  });
  const advanceWidth = Math.max(
    DEFAULT_FONT_METRICS.unitsPerEm / 2,
    Math.round(maskCanvas.width + DEFAULT_FONT_METRICS.sideBearing * 2),
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
  const sourceCanvas = createFontCanvas(sourceRect.width, sourceRect.height);

  getFontCanvasContext(sourceCanvas).drawImage(
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
