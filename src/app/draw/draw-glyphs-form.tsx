"use client";

import {
  WorkspaceHeader,
  WorkspaceIntro,
  workspaceSectionClass,
  workspacePanelClass,
  workspaceContentClass,
  workspaceFooterClass,
} from "../components/workspace";
import { ActionButton, actionClass } from "../components/action-button";
import { useEffect, useMemo, useState } from "react";
import { FontReview } from "../upload/font-review";
import {
  areAllLettersDrawn,
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
  const allLettersDrawn = areAllLettersDrawn(strokesByChar);
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
    <section className={workspaceSectionClass}>
      <div className={workspacePanelClass}>
        <div
          aria-label="Drawing workspace"
          className={`${styles.workspace} ${workspaceContentClass}`}
          role="region"
          tabIndex={0}
        >
          <WorkspaceHeader href="/upload">Use a photo instead</WorkspaceHeader>
          <WorkspaceIntro
            title={headerCopy.title}
            subtitle={headerCopy.subtitle}
          />
          {status === "generated" && generatedFont && generatedFontUrl ? (
            <>
              <FontReview
                error={error}
                fontUrl={generatedFontUrl}
                generatedFont={generatedFont}
              />
              <div className="my-4 grid grid-cols-2 gap-3">
                <ActionButton
                  variant="secondary"
                  onClick={startOver}
                  type="button"
                >
                  Draw again
                </ActionButton>
                <a
                  className={actionClass("primary")}
                  download={generatedFont.fileName}
                  href={generatedFontUrl}
                >
                  Download .ttf
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mt-6 w-full max-w-[min(440px,max(240px,calc(100dvh-540px)))]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <LetterChooser
                    activeChar={activeChar}
                    onSelectChar={setActiveChar}
                    strokesByChar={strokesByChar}
                    disabled={status === "generating"}
                  />
                  <ActionButton
                    aria-busy={status === "generating"}
                    variant="text"
                    disabled={!canGenerate}
                    onClick={() => void generateFont()}
                    type="button"
                  >
                    {status === "generating" ? "Preparing…" : "Preview font"}
                  </ActionButton>
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
            className={workspaceFooterClass}
            role="group"
          >
            <div
              className={`mx-auto grid w-full max-w-[min(440px,max(240px,calc(100dvh-540px)))] gap-3 ${
                allLettersDrawn ? "grid-cols-2" : "grid-cols-[1fr_1fr_1.5fr]"
              }`}
            >
              {allLettersDrawn ? (
                <>
                  <ActionButton
                    variant="secondary"
                    disabled={status === "generating"}
                    onClick={startOver}
                    type="button"
                  >
                    Redraw
                  </ActionButton>
                  <ActionButton
                    aria-busy={status === "generating"}
                    variant="primary"
                    disabled={status === "generating"}
                    onClick={() => void generateFont()}
                    type="button"
                  >
                    {status === "generating" ? "Preparing…" : "Generate font"}
                  </ActionButton>
                </>
              ) : (
                <>
                  <ActionButton
                    variant="secondary"
                    disabled={
                      activeStrokes.length === 0 || status === "generating"
                    }
                    onClick={undoStroke}
                    type="button"
                  >
                    Undo
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    disabled={
                      activeStrokes.length === 0 || status === "generating"
                    }
                    onClick={clearActiveChar}
                    type="button"
                  >
                    Clear
                  </ActionButton>
                  <ActionButton
                    variant="primary"
                    disabled={status === "generating"}
                    onClick={goToNextChar}
                    type="button"
                  >
                    Next letter
                  </ActionButton>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
