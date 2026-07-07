import type { AlphabetAnalysis } from "@/lib/extraction/schemas";
import { SUPPORTED_GLYPHS } from "@/lib/extraction/constants";

export type AnalysisSummaryLines = {
  glyphLine: string;
  issueLine: string;
};

export function getAnalysisSummaryLines(
  analysis: AlphabetAnalysis,
): AnalysisSummaryLines {
  const detectedLetters = new Set(
    analysis.letters.map((letter) => letter.char),
  );
  const issueCount =
    analysis.globalIssues.length +
    analysis.letters.reduce(
      (total, letter) => total + letter.issues.length,
      0,
    );

  if (analysis.source === "declaration-demo") {
    return {
      glyphLine: `${detectedLetters.size} demo glyphs selected from the Declaration screenshot`,
      issueLine: "Curated boxes keep the demo deterministic without training.",
    };
  }

  return {
    glyphLine: `${detectedLetters.size} of ${SUPPORTED_GLYPHS.length} glyphs detected`,
    issueLine:
      issueCount > 0
        ? `${issueCount} extraction warning${issueCount === 1 ? "" : "s"} found.`
        : "No major photo issues detected.",
  };
}

export function AnalysisSummary({
  analysis,
  variant = "panel",
}: {
  analysis: AlphabetAnalysis;
  variant?: "inline" | "panel";
}) {
  const { glyphLine, issueLine } = getAnalysisSummaryLines(analysis);

  if (variant === "inline") {
    return (
      <div className="mt-3">
        <p className="text-sm font-medium leading-5 text-ink">{glyphLine}</p>
        <p className="mt-1 text-sm font-light leading-5 text-subtitle">
          {issueLine}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-periwinkle/60 px-4 py-4 ring-1 ring-ink/8">
      <p className="text-sm font-medium text-ink">Analysis complete</p>
      <p className="mt-2 text-base font-medium leading-6 text-ink">{glyphLine}</p>
      <p className="mt-1 text-sm font-light leading-5 text-subtitle">
        {issueLine}
      </p>
    </div>
  );
}
