"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FontReview } from "../upload/font-review";
import {
  buildDrawnGlyphs,
  canGenerateDrawnFont,
  getDrawHeaderCopy,
  getDrawProgressLine,
  getNextUndrawnChar,
  type DrawnStatus,
  type DrawnStrokesByChar,
} from "./draw-helpers";
import { GlyphCanvas } from "./glyph-canvas";
import { GlyphPicker } from "./glyph-picker";
import { getLetterZoneCopy } from "./letter-guides";

import {
  createDrawnFontSource,
  type DrawnChar,
  type DrawnStroke,
} from "@/lib/font/drawn-glyphs";
import { generateHandwritingFontInWorker } from "@/lib/font/generate-handwriting-font-in-worker";
import type { GeneratedHandwritingFont } from "@/lib/font/types";

const actionFocusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2";

export function DrawGlyphsForm() {
  const [activeChar, setActiveChar] = useState<DrawnChar>("A");
  const [strokesByChar, setStrokesByChar] = useState<DrawnStrokesByChar>({});
  const [status, setStatus] = useState<DrawnStatus>("drawing");
  const [generatedFont, setGeneratedFont] =
    useState<GeneratedHandwritingFont | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generatedFontUrl = useMemo(
    () => (generatedFont ? URL.createObjectURL(generatedFont.blob) : null),
    [generatedFont],
  );
  const headerCopy = getDrawHeaderCopy(status);
  const activeStrokes = strokesByChar[activeChar] ?? [];
  const canGenerate = canGenerateDrawnFont(strokesByChar, status);

  useEffect(() => {
    if (!generatedFontUrl) {
      return;
    }

    return () => URL.revokeObjectURL(generatedFontUrl);
  }, [generatedFontUrl]);

  function commitStroke(stroke: DrawnStroke) {
    setStrokesByChar((current) => ({
      ...current,
      [activeChar]: [...(current[activeChar] ?? []), stroke],
    }));
  }

  function undoStroke() {
    setStrokesByChar((current) => ({
      ...current,
      [activeChar]: (current[activeChar] ?? []).slice(0, -1),
    }));
  }

  function clearActiveChar() {
    setStrokesByChar((current) => ({ ...current, [activeChar]: [] }));
  }

  function goToNextChar() {
    setActiveChar(getNextUndrawnChar(strokesByChar, activeChar));
  }

  function startOver() {
    setStrokesByChar({});
    setGeneratedFont(null);
    setStatus("drawing");
    setError(null);
    setActiveChar("A");
  }

  async function generateFont() {
    setStatus("generating");
    setError(null);

    try {
      const source = await createDrawnFontSource(
        buildDrawnGlyphs(strokesByChar),
      );
      const font = await generateHandwritingFontInWorker({
        sources: [source],
      });

      setGeneratedFont(font);
      setStatus("generated");
    } catch (caughtError) {
      setStatus("error");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not build your font. Try drawing a few more letters.",
      );
    }
  }

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-[680px] items-start justify-center sm:items-center">
      <div
        aria-label="Drawing workspace"
        className="upload-scroll max-h-full w-full overflow-x-hidden overflow-y-auto overscroll-y-contain bg-stone/95 px-5 py-5 shadow-[0_18px_50px_rgba(43,38,34,0.08)] ring-1 ring-ink/[0.06] backdrop-blur-[2px] sm:px-8 sm:py-7"
        role="region"
        tabIndex={0}
      >
        <header className="flex items-center justify-between">
          <Link
            aria-label="HandWrite home"
            className="inline-flex min-h-11 items-center font-serif text-xl font-bold italic tracking-[-0.02em] text-title transition-colors hover:text-subtitle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-4"
            href="/"
          >
            HandWrite
          </Link>
          <Link
            className={`min-h-11 text-sm font-medium text-subtitle underline decoration-ink/25 underline-offset-4 transition-colors hover:text-ink ${actionFocusClass}`}
            href="/upload"
          >
            Use a photo instead
          </Link>
        </header>

        <div className="mt-8 sm:mt-10">
          <h1 className="max-w-[600px] font-serif text-[36px] font-bold italic leading-[1.12] tracking-[-0.025em] text-title sm:text-[46px]">
            {headerCopy.title}
          </h1>
          <p className="mt-3 max-w-[480px] text-base leading-7 text-subtitle">
            {headerCopy.subtitle}
          </p>

          {status === "generated" && generatedFont && generatedFontUrl ? (
            <FontReview
              error={error}
              fontUrl={generatedFontUrl}
              generatedFont={generatedFont}
            />
          ) : (
            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium text-ink">
                  Drawing{" "}
                  <span className="font-serif text-lg italic">
                    {activeChar}
                  </span>
                </p>
                <p className="text-sm font-medium text-muted">
                  {getDrawProgressLine(strokesByChar)}
                </p>
              </div>

              <div className="mt-3 flex justify-center bg-linen/40 p-4">
                <GlyphCanvas
                  char={activeChar}
                  onCommitStroke={commitStroke}
                  strokes={activeStrokes}
                />
              </div>

              <p aria-live="polite" className="mt-3 text-sm leading-6 text-ink">
                {getLetterZoneCopy(activeChar)}{" "}
                <span className="text-subtitle">
                  The shaded band is your writing zone; dashed lines are for
                  reference.
                </span>
              </p>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <button
                  className={`flex h-11 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-inset ring-ink/10 transition-colors hover:bg-linen disabled:cursor-not-allowed disabled:text-muted ${actionFocusClass}`}
                  disabled={activeStrokes.length === 0}
                  onClick={undoStroke}
                  type="button"
                >
                  Undo
                </button>
                <button
                  className={`flex h-11 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-inset ring-ink/10 transition-colors hover:bg-linen disabled:cursor-not-allowed disabled:text-muted ${actionFocusClass}`}
                  disabled={activeStrokes.length === 0}
                  onClick={clearActiveChar}
                  type="button"
                >
                  Clear
                </button>
                <button
                  className={`flex h-11 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-inset ring-ink/10 transition-colors hover:bg-linen ${actionFocusClass}`}
                  onClick={goToNextChar}
                  type="button"
                >
                  Next letter
                </button>
              </div>

              <GlyphPicker
                activeChar={activeChar}
                onSelectChar={setActiveChar}
                strokesByChar={strokesByChar}
              />

              <p className="mt-4 text-sm leading-6 text-subtitle">
                Draw as few or as many letters as you like. Undrawn lowercase
                letters fall back to your uppercase shapes.
              </p>

              {error ? (
                <p
                  aria-live="assertive"
                  className="mt-3 text-sm font-medium leading-5 text-coral"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {status === "generated" && generatedFont && generatedFontUrl ? (
            <>
              <button
                className={`flex h-14 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-inset ring-ink/10 transition-colors hover:bg-linen ${actionFocusClass}`}
                onClick={startOver}
                type="button"
              >
                Draw again
              </button>
              <a
                className={`flex h-14 items-center justify-center bg-button text-sm font-semibold text-button-foreground shadow-[0_8px_24px_rgba(43,38,34,0.08)] transition-colors hover:bg-button-hover ${actionFocusClass}`}
                download={generatedFont.fileName}
                href={generatedFontUrl}
              >
                Download .ttf
              </a>
            </>
          ) : (
            <button
              aria-busy={status === "generating"}
              className={`flex h-14 items-center justify-center bg-button text-sm font-semibold text-button-foreground shadow-[0_8px_24px_rgba(43,38,34,0.08)] transition-colors hover:bg-button-hover disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none sm:col-start-2 ${actionFocusClass}`}
              disabled={!canGenerate}
              onClick={() => void generateFont()}
              type="button"
            >
              {status === "generating" ? "Generating" : "Generate font"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
