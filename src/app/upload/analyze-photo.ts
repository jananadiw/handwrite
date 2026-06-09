import type { AlphabetAnalysis } from "@/lib/extraction/schemas";
import type { AnalyzeResponse } from "./upload-types";

export async function analyzePhoto(photo: File): Promise<AlphabetAnalysis> {
  const formData = new FormData();
  formData.append("photo", photo);

  const response = await fetch("/api/extract/analyze", {
    method: "POST",
    body: formData,
  });
  const result = (await response.json()) as AnalyzeResponse;

  if (!response.ok || "error" in result) {
    throw new Error(
      "error" in result
        ? result.error.message
        : "We could not analyze that photo.",
    );
  }

  return result.analysis;
}
