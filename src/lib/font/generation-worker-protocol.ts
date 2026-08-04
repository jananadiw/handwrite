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

type GenerateFontWorkerSuccessResponse = Omit<
  GeneratedHandwritingFont,
  "blob"
> & {
  type: "generated-font";
  id: string;
  fontBuffer: ArrayBuffer;
};

type GenerateFontWorkerErrorResponse = {
  type: "generation-error";
  id: string;
  message: string;
};
