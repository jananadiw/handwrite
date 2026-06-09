import {
  MAX_ANALYSIS_IMAGE_BYTES,
  SUPPORTED_IMAGE_MIME_TYPES,
} from "@/lib/extraction/constants";
import { analyzeAlphabetPhoto } from "@/lib/server/gemini/client";

type ErrorCode =
  | "missing_photo"
  | "unsupported_type"
  | "image_too_large"
  | "missing_api_key"
  | "analysis_failed";

function errorResponse({
  code,
  message,
  status,
}: {
  code: ErrorCode;
  message: string;
  status: number;
}) {
  return Response.json({ error: { code, message } }, { status });
}

function isSupportedMimeType(mimeType: string) {
  return SUPPORTED_IMAGE_MIME_TYPES.some(
    (supportedType) => supportedType === mimeType,
  );
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse({
      code: "missing_photo",
      message: "Upload a handwriting photo before generating.",
      status: 400,
    });
  }

  const photo = formData.get("photo");

  if (!(photo instanceof File)) {
    return errorResponse({
      code: "missing_photo",
      message: "Upload a handwriting photo before generating.",
      status: 400,
    });
  }

  if (!isSupportedMimeType(photo.type)) {
    return errorResponse({
      code: "unsupported_type",
      message: "Use a JPEG, PNG, WEBP, HEIC, or HEIF photo.",
      status: 415,
    });
  }

  if (photo.size > MAX_ANALYSIS_IMAGE_BYTES) {
    return errorResponse({
      code: "image_too_large",
      message: "That photo is too large. Try a smaller image.",
      status: 413,
    });
  }

  try {
    const analysis = await analyzeAlphabetPhoto({
      imageBytes: await photo.arrayBuffer(),
      mimeType: photo.type,
    });

    return Response.json({ analysis });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured."
    ) {
      return errorResponse({
        code: "missing_api_key",
        message: "Gemini is not configured for this app.",
        status: 500,
      });
    }

    return errorResponse({
      code: "analysis_failed",
      message: "We could not analyze that photo. Try another clear photo.",
      status: 502,
    });
  }
}
