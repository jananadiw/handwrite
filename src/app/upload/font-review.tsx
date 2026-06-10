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

  return (
    <section className="mt-6 border border-indigo bg-stone px-4 py-5 sm:px-5">
      <style>{`
        @font-face {
          font-family: "${previewFamily}";
          src: url("${fontUrl}") format("truetype");
          font-display: block;
        }
      `}</style>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-indigo">
            Review font
          </p>
          <h2 className="mt-2 text-2xl font-medium leading-7 text-ink">
            Your .ttf is ready
          </h2>
          <p className="mt-2 text-sm font-light leading-5 text-muted">
            {generatedFont.generatedLetters.length}/{SUPPORTED_GLYPHS.length} glyphs generated
          </p>
        </div>
        <a
          className="flex h-12 items-center justify-center border border-indigo bg-indigo px-5 text-sm font-medium text-stone hover:bg-ink"
          download={generatedFont.fileName}
          href={fontUrl}
        >
          Download .ttf
        </a>
      </div>

      <div className="mt-5 overflow-hidden border border-linen bg-white px-4 py-5">
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
        <p className="mt-4 text-sm font-medium leading-6 text-indigo">
          Missing glyphs: {generatedFont.missingLetters.join(", ")}
        </p>
      ) : null}
    </section>
  );
}
