"use client";

import { FONT_MIME_TYPE } from "@/lib/font/constants";
import type {
  GenerateFontWorkerRequest,
  GenerateFontWorkerResponse,
} from "@/lib/font/generation-worker-protocol";
import type {
  GeneratedHandwritingFont,
  HandwritingFontSource,
} from "@/lib/font/types";
import type { NormalisedJpeg } from "@/lib/images/normalise-to-jpeg";

export async function generateHandwritingFontInWorker({
  sources,
}: {
  sources: HandwritingFontSource[];
}): Promise<GeneratedHandwritingFont> {
  if (typeof Worker === "undefined") {
    const { generateHandwritingFont } = await import(
      "@/lib/font/generate-handwriting-font"
    );

    return generateHandwritingFont({ sources });
  }

  const id = createRequestId();
  const worker = new Worker(
    new URL("./generate-handwriting-font.worker.ts", import.meta.url),
    { type: "module" },
  );

  return new Promise((resolve, reject) => {
    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.postMessage({
      type: "generate-font",
      id,
      sources,
    } satisfies GenerateFontWorkerRequest);

    function handleMessage(event: MessageEvent<GenerateFontWorkerResponse>) {
      const response = event.data;

      if (response.id !== id) {
        return;
      }

      cleanup();

      if (response.type === "generation-error") {
        reject(new Error(response.message));
        return;
      }

      resolve({
        blob: new Blob([response.fontBuffer], { type: FONT_MIME_TYPE }),
        familyName: response.familyName,
        fileName: response.fileName,
        generatedLetters: response.generatedLetters,
        missingLetters: response.missingLetters,
      });
    }

    function handleError() {
      cleanup();
      reject(new Error("We could not finish your font. Try another clear photo."));
    }

    function cleanup() {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      worker.terminate();
    }
  });
}

export function createHandwritingFontSource({
  analysis,
  normalisedPhoto,
}: {
  analysis: HandwritingFontSource["analysis"];
  normalisedPhoto: NormalisedJpeg;
}): HandwritingFontSource {
  return {
    analysis,
    photo: normalisedPhoto.blob,
    height: normalisedPhoto.height,
    width: normalisedPhoto.width,
  };
}

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
