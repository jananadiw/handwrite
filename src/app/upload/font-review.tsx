"use client";

import { useId } from "react";
import { SUPPORTED_GLYPHS } from "@/lib/extraction/constants";
import type { GeneratedHandwritingFont } from "@/lib/font/generate-handwriting-font";

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

export function FontReview({
  generatedFont,
  fontUrl,
}: {
  generatedFont: GeneratedHandwritingFont;
  fontUrl: string;
}) {
  const fontId = useId().replace(/\W/g, "");
  const previewFamily = `handwrite-preview-${fontId}`;
  const generatedGlyphLine = `${generatedFont.generatedLetters.length} of ${SUPPORTED_GLYPHS.length} glyphs generated`;

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
        <p className="mt-2 text-base font-medium leading-6 text-ink">
          {generatedGlyphLine}
        </p>
      </div>

      <div className="mt-5 overflow-hidden bg-white px-4 py-5 shadow-[inset_0_0_24px_rgba(43,38,34,0.04)]">
        <div
          className="grid max-w-full gap-2 overflow-hidden text-[30px] leading-[1.15] tracking-normal text-ink sm:text-[40px]"
          style={{ fontFamily: `"${previewFamily}"` }}
        >
          {REVIEW_SAMPLE_ROWS.map((sample) => (
            <p className="max-w-full overflow-hidden break-all" key={sample}>
              {sample}
            </p>
          ))}
        </div>
      </div>

      {generatedFont.missingLetters.length > 0 ? (
        <div className="mt-4 bg-linen px-4 py-4 ring-1 ring-ink/8">
          <p className="text-sm font-medium leading-6 text-ink">
            Missing glyphs: {generatedFont.missingLetters.join(", ")}
          </p>
          <p className="mt-1 text-sm font-light leading-6 text-subtitle">
            Write these glyphs clearly and upload another photo to improve the
            font.
          </p>
        </div>
      ) : null}
    </section>
  );
}
