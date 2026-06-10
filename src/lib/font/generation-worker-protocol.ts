import type { AlphabetAnalysis } from "@/lib/extraction/schemas";
import type { GeneratedHandwritingFont } from "@/lib/font/types";

export type GenerateFontWorkerRequest = {
  type: "generate-font";
  id: string;
  analysis: AlphabetAnalysis;
  photo: Blob;
  width: number;
  height: number;
};

export type GenerateFontWorkerResponse =
  | GenerateFontWorkerSuccessResponse
  | GenerateFontWorkerErrorResponse;

export type GenerateFontWorkerSuccessResponse = Omit<
  GeneratedHandwritingFont,
  "blob"
> & {
  type: "generated-font";
  id: string;
  fontBuffer: ArrayBuffer;
};

export type GenerateFontWorkerErrorResponse = {
  type: "generation-error";
  id: string;
  message: string;
};
