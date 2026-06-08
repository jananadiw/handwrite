export type NormalisedJpeg = {
  file: File;
  blob: Blob;
  width: number;
  height: number;
};

export const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_API_IMAGE_BYTES = 1 * 1024 * 1024;

const HEIC_FILE_PATTERN = /\.(heic|heif)$/i;
const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif"]);
const STARTING_MAX_EDGE = 2000;
const MIN_MAX_EDGE = 640;
const STARTING_QUALITY = 0.86;
const MIN_QUALITY = 0.5;

export async function normaliseToJpeg(file: File): Promise<NormalisedJpeg> {
  const source = await getBitmapSource(file);
  const bitmap = await createImageBitmap(source);
  let maxEdge = STARTING_MAX_EDGE;
  let quality = STARTING_QUALITY;

  while (maxEdge >= MIN_MAX_EDGE) {
    const dimensions = fitWithin(bitmap.width, bitmap.height, maxEdge);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      throw new Error("Canvas is unavailable.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, dimensions.width, dimensions.height);
    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);

    while (quality >= MIN_QUALITY) {
      const blob = await canvasToJpeg(canvas, quality);

      if (blob.size < MAX_API_IMAGE_BYTES) {
        bitmap.close();

        return {
          file: new File([blob], "handwriting-upload.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
          }),
          blob,
          width: dimensions.width,
          height: dimensions.height,
        };
      }

      quality -= 0.08;
    }

    maxEdge = Math.floor(maxEdge * 0.82);
    quality = STARTING_QUALITY;
  }

  bitmap.close();
  throw new Error("Photo could not be compressed under the API limit.");
}

async function getBitmapSource(file: File) {
  if (!isHeic(file)) {
    return file;
  }

  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({
    blob: file,
    quality: STARTING_QUALITY,
    toType: "image/jpeg",
  });

  return Array.isArray(converted) ? converted[0] : converted;
}

function isHeic(file: File) {
  return HEIC_MIME_TYPES.has(file.type) || HEIC_FILE_PATTERN.test(file.name);
}

function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("JPEG conversion failed."));
      },
      "image/jpeg",
      quality,
    );
  });
}
