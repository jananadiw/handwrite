export type FontCanvas = HTMLCanvasElement | OffscreenCanvas;
export type FontCanvasContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

export function createFontCanvas(width: number, height: number): FontCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    return canvas;
  }

  throw new Error("Canvas is unavailable.");
}

export function getFontCanvasContext(canvas: FontCanvas): FontCanvasContext {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas is unavailable.");
  }

  return context;
}
