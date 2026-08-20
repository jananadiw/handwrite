"use client";

import { useId, useState } from "react";
import { SUPPORTED_GLYPHS } from "@/lib/extraction/constants";
import type { GeneratedHandwritingFont } from "@/lib/font/generate-handwriting-font";
import {
  DEFAULT_PREVIEW_TEXT,
  getPreviewDisplayText,
  getPreviewFallbackNotice,
  getUnsupportedPreviewCharacters,
  normalisePreviewText,
  PREVIEW_TEXT_MAX_LENGTH,
} from "./font-preview-text";

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
  const [previewText, setPreviewText] = useState(DEFAULT_PREVIEW_TEXT);
  const previewFamily = `handwrite-preview-${fontId}`;
  const previewInputId = `handwrite-preview-input-${fontId}`;
  const previewNoticeId = `handwrite-preview-notice-${fontId}`;
  const generatedGlyphLine = `${generatedFont.generatedLetters.length} of ${SUPPORTED_GLYPHS.length} glyphs generated`;
  const displayText = getPreviewDisplayText(previewText);
  const fallbackNotice = getPreviewFallbackNotice(
    getUnsupportedPreviewCharacters(
      displayText,
      generatedFont.generatedLetters,
    ),
  );

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
            Type anything to see it in your handwriting.
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium text-muted">
          {generatedGlyphLine}
        </p>
      </div>

      <div className="overflow-hidden bg-white px-5 py-7 shadow-[inset_0_0_24px_rgba(43,38,34,0.04)] sm:px-7 sm:py-9">
        <p
          aria-live="polite"
          className="max-w-full overflow-hidden break-all text-[32px] leading-[1.12] tracking-normal text-ink sm:text-[46px]"
          style={{ fontFamily: `"${previewFamily}"` }}
        >
          {displayText}
        </p>
      </div>

      <div className="border-t border-ink/8 px-4 py-4 sm:px-5">
        <label
          className="text-sm font-medium leading-5 text-ink"
          htmlFor={previewInputId}
        >
          Preview your own words
        </label>
        <input
          aria-describedby={fallbackNotice ? previewNoticeId : undefined}
          autoComplete="off"
          className="mt-2 h-12 w-full bg-linen/55 px-3 text-base text-ink ring-1 ring-inset ring-ink/10 transition-colors placeholder:text-muted hover:bg-linen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button"
          id={previewInputId}
          maxLength={PREVIEW_TEXT_MAX_LENGTH}
          onChange={(event) =>
            setPreviewText(normalisePreviewText(event.target.value))
          }
          placeholder={DEFAULT_PREVIEW_TEXT}
          type="text"
          value={previewText}
        />
        {fallbackNotice ? (
          <p
            aria-live="polite"
            className="mt-2 text-sm leading-5 text-muted"
            id={previewNoticeId}
          >
            {fallbackNotice}
          </p>
        ) : null}
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
