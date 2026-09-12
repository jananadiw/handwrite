"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FontReview } from "../upload/font-review";
import {
  buildDrawnGlyphs,
  canGenerateDrawnFont,
  getDrawHeaderCopy,
  getDrawnChars,
  getDrawProgressLine,
  getNextUndrawnChar,
  type DrawnStatus,
  type DrawnStrokesByChar,
} from "./draw-helpers";
import { GlyphCanvas } from "./glyph-canvas";
import { LetterChooser } from "./letter-chooser";
import { SUPPORTED_GLYPHS } from "@/lib/extraction/constants";

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
  const drawnCount = getDrawnChars(strokesByChar).length;
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
      <div className="flex max-h-full w-full flex-col overflow-hidden bg-stone/95 shadow-[0_18px_50px_rgba(43,38,34,0.08)] ring-1 ring-ink/[0.06] backdrop-blur-[2px]">
        <div
          aria-label="Drawing workspace"
          className="upload-scroll min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-8 sm:py-5"
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

          <div className="mt-4 sm:mt-5">
            <h1 className="max-w-[600px] font-serif text-[32px] font-bold italic leading-[1.12] tracking-[-0.025em] text-title sm:text-[38px]">
              {headerCopy.title}
            </h1>
            <p className="mt-2 max-w-[480px] text-sm leading-6 text-subtitle">
              {headerCopy.subtitle}
            </p>

            {status === "generated" && generatedFont && generatedFontUrl ? (
              <FontReview
                error={error}
                fontUrl={generatedFontUrl}
                generatedFont={generatedFont}
              />
            ) : (
              <div className="mt-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm font-medium text-ink">
                    Drawing{" "}
                    <span className="font-serif text-lg italic">
                      {activeChar}
                    </span>
                  </p>
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="text-sm tabular-nums text-muted">
                      {drawnCount} / {SUPPORTED_GLYPHS.length}
                    </span>
                    <div
                      aria-label="Letters drawn"
                      aria-valuemax={SUPPORTED_GLYPHS.length}
                      aria-valuemin={0}
                      aria-valuenow={drawnCount}
                      aria-valuetext={getDrawProgressLine(strokesByChar)}
                      className="h-1 w-16 overflow-hidden rounded-full bg-ink/10 sm:w-24"
                      role="progressbar"
                    >
                      <div
                        className="h-full bg-button transition-[width] duration-300 motion-reduce:transition-none"
                        style={{ width: `${(drawnCount / SUPPORTED_GLYPHS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-center bg-linen/40 p-3">
                  <GlyphCanvas
                    char={activeChar}
                    onCommitStroke={commitStroke}
                    strokes={activeStrokes}
                  />
                </div>

                <LetterChooser
                  activeChar={activeChar}
                  onSelectChar={setActiveChar}
                  strokesByChar={strokesByChar}
                />

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

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                className={`flex h-12 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-inset ring-ink/15 transition-colors hover:bg-linen disabled:cursor-not-allowed disabled:text-muted sm:col-start-2 ${actionFocusClass}`}
                disabled={!canGenerate}
                onClick={() => void generateFont()}
                type="button"
              >
                {status === "generating" ? "Generating" : "Generate font"}
              </button>
            )}
          </div>
        </div>
        {status !== "generated" && (
          <div
            aria-label="Drawing controls"
            className="grid shrink-0 grid-cols-[1fr_1fr_1.5fr] gap-2 border-t border-ink/10 bg-stone px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8"
            role="group"
          >
            <button
              className={`flex h-12 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-inset ring-ink/10 transition-colors hover:bg-linen disabled:cursor-not-allowed disabled:text-muted ${actionFocusClass}`}
              disabled={activeStrokes.length === 0 || status === "generating"}
              onClick={undoStroke}
              type="button"
            >
              Undo
            </button>
            <button
              className={`flex h-12 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-inset ring-ink/10 transition-colors hover:bg-linen disabled:cursor-not-allowed disabled:text-muted ${actionFocusClass}`}
              disabled={activeStrokes.length === 0 || status === "generating"}
              onClick={clearActiveChar}
              type="button"
            >
              Clear
            </button>
            <button
              className={`flex h-12 items-center justify-center bg-button text-sm font-semibold text-button-foreground transition-colors hover:bg-button-hover disabled:opacity-50 ${actionFocusClass}`}
              disabled={status === "generating"}
              onClick={goToNextChar}
              type="button"
            >
              Next letter
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
