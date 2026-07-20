"use client";

import { useId } from "react";
import type { AlphabetAnalysis } from "@/lib/extraction/schemas";
import { SUPPORTED_GLYPHS } from "@/lib/extraction/constants";
import type { GeneratedHandwritingFont } from "@/lib/font/generate-handwriting-font";
import { getAnalysisSummaryLines } from "./analysis-summary";

const REVIEW_SAMPLE_ROWS = [
  "HANDWRITE",
  "handwrite",
  "THE QUICK",
  "BROWN FOX",
  "abcdefghi",
  "jklmnopqr",
  "stuvwxyz",
  "ABCDEFGHI",
  "JKLMNOPQR",
  "STUVWXYZ",
];

const DECLARATION_DEMO_SAMPLE_ROWS = [
  "we have warned them",
  "he has refused",
  "our native justice",
  "all ages conditions",
  "has made judges",
];

export function FontReview({
  analysis,
  generatedFont,
  fontUrl,
}: {
  analysis: AlphabetAnalysis | null;
  generatedFont: GeneratedHandwritingFont;
  fontUrl: string;
}) {
  const fontId = useId().replace(/\W/g, "");
  const previewFamily = `handwrite-preview-${fontId}`;
  const analysisLines = analysis ? getAnalysisSummaryLines(analysis) : null;
  const sampleRows = getReviewSampleRows({
    generatedLetters: generatedFont.generatedLetters,
    source: analysis?.source ?? "alphabet",
  });
  const isDeclarationDemo = analysis?.source === "declaration-demo";

  return (
    <section className="mt-6 ring-1 ring-ink/8 px-4 py-5 sm:px-5">
      <style>{`
        @font-face {
          font-family: "${previewFamily}";
          src: url("${fontUrl}") format("truetype");
          font-display: block;
        }
      `}</style>

      <div>
        <p className="text-sm font-medium text-ink">Review font</p>
        <h2 className="mt-2 text-2xl font-medium leading-7 text-ink">
          Your .ttf is ready
        </h2>
        {analysisLines ? (
          <>
            <p className="mt-2 text-base font-medium leading-6 text-ink">
              {analysisLines.glyphLine}
            </p>
            <p className="mt-1 text-sm font-light leading-5 text-subtitle">
              {analysisLines.issueLine}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm font-light leading-5 text-subtitle">
            {generatedFont.generatedLetters.length}/{SUPPORTED_GLYPHS.length}{" "}
            glyphs generated
          </p>
        )}
      </div>

      <div className="mt-5 overflow-hidden bg-white px-4 py-5 shadow-[inset_0_0_24px_rgba(43,38,34,0.04)]">
        <div
          className="grid max-w-full gap-2 overflow-hidden text-[30px] leading-[1.15] tracking-normal text-ink sm:text-[40px]"
          style={{ fontFamily: `"${previewFamily}"` }}
        >
          {sampleRows.map((sample) => (
            <p className="max-w-full overflow-hidden break-all" key={sample}>
              {sample}
            </p>
          ))}
        </div>
      </div>

      {isDeclarationDemo ? (
        <p className="mt-4 text-sm font-medium leading-6 text-ink">
          Demo font uses selected glyphs from the Declaration screenshot.
        </p>
      ) : generatedFont.missingLetters.length > 0 ? (
        <p className="mt-4 text-sm font-medium leading-6 text-ink">
          Missing glyphs: {generatedFont.missingLetters.join(", ")}
        </p>
      ) : null}
    </section>
  );
}

function getReviewSampleRows({
  generatedLetters,
  source,
}: {
  generatedLetters: string[];
  source: NonNullable<AlphabetAnalysis["source"]>;
}) {
  if (source !== "declaration-demo") {
    return REVIEW_SAMPLE_ROWS;
  }

  const generated = new Set(generatedLetters);
  const safeRows = DECLARATION_DEMO_SAMPLE_ROWS.filter((sample) =>
    Array.from(sample).every((char) => char === " " || generated.has(char)),
  );

  return safeRows.length > 0 ? safeRows : [generatedLetters.join("")];
}
