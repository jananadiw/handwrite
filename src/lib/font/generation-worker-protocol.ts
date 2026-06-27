import type {
  GeneratedHandwritingFont,
  HandwritingFontSource,
} from "@/lib/font/types";

export type GenerateFontWorkerRequest = {
  type: "generate-font";
  id: string;
  sources: HandwritingFontSource[];
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
