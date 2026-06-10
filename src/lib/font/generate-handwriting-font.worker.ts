import { generateHandwritingFont } from "@/lib/font/generate-handwriting-font";
import type {
  GenerateFontWorkerRequest,
  GenerateFontWorkerResponse,
} from "@/lib/font/generation-worker-protocol";

type FontGenerationWorkerScope = {
  addEventListener: (
    type: "message",
    listener: (event: MessageEvent<GenerateFontWorkerRequest>) => void,
  ) => void;
  postMessage: (
    message: GenerateFontWorkerResponse,
    transfer?: Transferable[],
  ) => void;
};

const workerScope = self as unknown as FontGenerationWorkerScope;

workerScope.addEventListener(
  "message",
  async (event: MessageEvent<GenerateFontWorkerRequest>) => {
    const request = event.data;

    if (request.type !== "generate-font") {
      return;
    }

    try {
      const generatedFont = await generateHandwritingFont({
        analysis: request.analysis,
        normalisedPhoto: {
          blob: request.photo,
          height: request.height,
          width: request.width,
        },
      });
      const fontBuffer = await generatedFont.blob.arrayBuffer();
      const response: GenerateFontWorkerResponse = {
        type: "generated-font",
        id: request.id,
        familyName: generatedFont.familyName,
        fileName: generatedFont.fileName,
        fontBuffer,
        generatedLetters: generatedFont.generatedLetters,
        missingLetters: generatedFont.missingLetters,
      };

      workerScope.postMessage(response, [fontBuffer]);
    } catch {
      const response: GenerateFontWorkerResponse = {
        type: "generation-error",
        id: request.id,
        message: "We could not finish your font. Try another clear photo.",
      };

      workerScope.postMessage(response);
    }
  },
);

export {};
