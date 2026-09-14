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
import styles from "./draw-studio.module.css";
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2 transition-[color,background-color,transform] duration-150 enabled:active:translate-y-px motion-reduce:transition-none motion-reduce:transform-none";

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
    <section className="mx-auto flex h-full min-h-0 w-full max-w-[min(460px,max(240px,calc(100dvh-300px)))] flex-col justify-center">
      <div className="flex max-h-full flex-col bg-stone/95 px-4 pt-3 shadow-[0_18px_50px_rgba(43,38,34,0.08)] ring-1 ring-ink/[0.06] sm:px-5 sm:pt-4">
        <div
          aria-label="Drawing workspace"
          className={`${styles.workspace} min-h-0 overflow-y-auto overscroll-y-contain px-1`}
          role="region"
          tabIndex={0}
        >
          <header className="flex items-center justify-between gap-4">
            <Link
              aria-label="HandWrite home"
              className={`flex min-h-11 items-center font-serif text-xl font-bold italic tracking-[-0.02em] text-title ${actionFocusClass}`}
              href="/"
            >
              HandWrite
            </Link>
            <Link
              className={`flex min-h-11 items-center text-xs text-subtitle hover:text-ink ${actionFocusClass}`}
              href="/upload"
            >
              Use a photo instead
            </Link>
          </header>
          <div className="mt-4 mb-5">
            <h1 className="font-serif text-[32px] font-bold italic leading-[1.12] tracking-[-0.025em] text-title sm:text-[38px]">
              {headerCopy.title}
            </h1>
            <p className="mt-2 max-w-[360px] text-sm leading-6 text-subtitle">
              {headerCopy.subtitle}
            </p>
          </div>
          {status === "generated" && generatedFont && generatedFontUrl ? (
            <>
              <FontReview
                error={error}
                fontUrl={generatedFontUrl}
                generatedFont={generatedFont}
              />
              <div className="my-4 grid grid-cols-2 gap-3">
                <button
                  className={`min-h-12 rounded-lg text-sm text-ink hover:bg-linen ${actionFocusClass}`}
                  onClick={startOver}
                  type="button"
                >
                  Draw again
                </button>
                <a
                  className={`flex min-h-12 items-center justify-center rounded-lg bg-button text-sm font-semibold text-button-foreground hover:bg-button-hover ${actionFocusClass}`}
                  download={generatedFont.fileName}
                  href={generatedFontUrl}
                >
                  Download .ttf
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between gap-3">
                <LetterChooser
                  activeChar={activeChar}
                  onSelectChar={setActiveChar}
                  strokesByChar={strokesByChar}
                  disabled={status === "generating"}
                />
                <button
                  aria-busy={status === "generating"}
                  className={`min-h-11 rounded-md px-2 text-sm font-medium text-subtitle hover:bg-linen hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${actionFocusClass}`}
                  disabled={!canGenerate}
                  onClick={() => void generateFont()}
                  type="button"
                >
                  {status === "generating" ? "Preparing…" : "Preview font"}
                </button>
              </div>
              <div key={activeChar} className={styles.letterEnter}>
                <GlyphCanvas
                  char={activeChar}
                  onCommitStroke={commitStroke}
                  strokes={activeStrokes}
                />
              </div>
              <div className="mt-3 mb-1 flex items-center gap-3">
                <div
                  aria-label="Letters drawn"
                  aria-valuemax={SUPPORTED_GLYPHS.length}
                  aria-valuemin={0}
                  aria-valuenow={drawnCount}
                  aria-valuetext={getDrawProgressLine(strokesByChar)}
                  className="h-0.5 flex-1 overflow-hidden rounded-full bg-ink/10"
                  role="progressbar"
                >
                  <div
                    className="h-full origin-left bg-button transition-transform duration-200 ease-out motion-reduce:transition-none"
                    style={{
                      transform: `scaleX(${drawnCount / SUPPORTED_GLYPHS.length})`,
                    }}
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="text-xs tabular-nums text-subtitle"
                >
                  {drawnCount} / {SUPPORTED_GLYPHS.length}
                </span>
              </div>
              {error && (
                <p
                  aria-live="assertive"
                  className="my-3 text-sm leading-5 text-coral"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </>
          )}
        </div>
        {status !== "generated" && (
          <div
            aria-label="Drawing controls"
            className="grid shrink-0 grid-cols-[1fr_1fr_1.5fr] gap-2 bg-stone px-1 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            role="group"
          >
            <button
              className={`flex h-12 items-center justify-center rounded-lg text-sm font-medium text-subtitle hover:bg-linen hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${actionFocusClass}`}
              disabled={activeStrokes.length === 0 || status === "generating"}
              onClick={undoStroke}
              type="button"
            >
              Undo
            </button>
            <button
              className={`flex h-12 items-center justify-center rounded-lg text-sm font-medium text-subtitle hover:bg-linen hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${actionFocusClass}`}
              disabled={activeStrokes.length === 0 || status === "generating"}
              onClick={clearActiveChar}
              type="button"
            >
              Clear
            </button>
            <button
              className={`flex h-12 items-center justify-center gap-3 rounded-lg bg-button text-sm font-semibold text-button-foreground hover:bg-button-hover disabled:opacity-40 ${actionFocusClass}`}
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
