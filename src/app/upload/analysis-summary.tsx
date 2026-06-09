import type { AlphabetAnalysis } from "@/lib/extraction/schemas";

export function AnalysisSummary({ analysis }: { analysis: AlphabetAnalysis }) {
  const detectedLetters = new Set(analysis.letters.map((letter) => letter.char));
  const issueCount =
    analysis.globalIssues.length +
    analysis.letters.reduce((total, letter) => total + letter.issues.length, 0);

  return (
    <div className="mt-6 border border-indigo bg-periwinkle px-4 py-4">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-indigo">
        Analysis complete
      </p>
      <p className="mt-2 text-base font-medium leading-6 text-ink">
        {detectedLetters.size} of 26 letters detected
      </p>
      <p className="mt-1 text-sm font-light leading-5 text-muted">
        {issueCount > 0
          ? `${issueCount} extraction warning${issueCount === 1 ? "" : "s"} found.`
          : "No major photo issues detected."}
      </p>
    </div>
  );
}
