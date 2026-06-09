import type { AlphabetAnalysis } from "@/lib/extraction/schemas";

export type UploadStatus =
  | "idle"
  | "normalising"
  | "ready"
  | "analyzing"
  | "analyzed"
  | "error";

export type AnalyzeResponse =
  | {
      analysis: AlphabetAnalysis;
    }
  | {
      error: {
        code: string;
        message: string;
      };
    };
