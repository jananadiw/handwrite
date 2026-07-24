"use client";

import { useId } from "react";
import { SUPPORTED_GLYPHS } from "@/lib/extraction/constants";
import type { GeneratedHandwritingFont } from "@/lib/font/generate-handwriting-font";

const REVIEW_SAMPLE_ROWS = [
  "HANDWRITE",
  "handwrite",
  "THE QUICK BROWN FOX",
  "abcdefghijklmnopqrstuvwxyz",
];

export function FontReview({
  error,
  generatedFont,
  fontUrl,
}: {
  error?: string | null;
  generatedFont: GeneratedHandwritingFont;
  fontUrl: string;
}) {
  const fontId = useId().replace(/\W/g, "");
  const previewFamily = `handwrite-preview-${fontId}`;
  const generatedGlyphLine = `${generatedFont.generatedLetters.length} of ${SUPPORTED_GLYPHS.length} glyphs generated`;

  return (
    <section className="font-result-reveal mt-6 overflow-hidden border border-ink/12 bg-stone/80">
      <style>{`
        @font-face {
          font-family: "${previewFamily}";
          src: url("${fontUrl}") format("truetype");
          font-display: block;
        }
      `}</style>

      <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-4 py-4 sm:px-5">
        <div>
          <p className="text-sm font-medium text-ink">Font preview</p>
          <p className="mt-1 text-sm leading-5 text-subtitle">
            Your handwriting is ready to use.
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium text-muted">
          {generatedGlyphLine}
        </p>
      </div>

      <div className="overflow-hidden bg-white px-5 py-7 shadow-[inset_0_0_24px_rgba(43,38,34,0.04)] sm:px-7 sm:py-9">
        <div
          className="grid max-w-full gap-3 overflow-hidden text-[32px] leading-[1.12] tracking-normal text-ink sm:text-[46px]"
          style={{ fontFamily: `"${previewFamily}"` }}
        >
          {REVIEW_SAMPLE_ROWS.map((sample) => (
            <p className="max-w-full overflow-hidden break-all" key={sample}>
              {sample}
            </p>
          ))}
        </div>
      </div>

      {error ? (
        <p
          aria-live="assertive"
          className="border-t border-ink/8 px-4 py-3 text-sm font-medium leading-5 text-coral sm:px-5"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {generatedFont.missingLetters.length > 0 ? (
        <div className="border-t border-ink/8 bg-linen/65 px-4 py-4 sm:px-5">
          <p className="text-sm font-medium leading-6 text-ink">
            Missing glyphs: {generatedFont.missingLetters.join(", ")}
          </p>
          <p className="mt-1 text-sm leading-6 text-subtitle">
            Add one more photo with these glyphs to improve your font.
          </p>
        </div>
      ) : null}
    </section>
  );
}
