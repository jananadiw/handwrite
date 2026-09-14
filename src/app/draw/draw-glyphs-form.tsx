"use client";

import { FontDownload } from "../components/font-download";

import { useObjectUrl } from "../hooks/use-object-url";

import {
  WorkspaceHeader,
  WorkspaceIntro,
  Workspace,
  workspaceFooterClass,
} from "../components/workspace";
import { ActionButton } from "../components/action-button";
import { useState } from "react";
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

const drawingRailClass =
  "mx-auto w-full max-w-[min(440px,max(240px,calc(100dvh-540px)))]";

export function DrawGlyphsForm() {
  const [activeChar, setActiveChar] = useState<DrawnChar>("A");
  const [strokesByChar, setStrokesByChar] = useState<DrawnStrokesByChar>({});
  const [status, setStatus] = useState<DrawnStatus>("drawing");
  const [generatedFont, setGeneratedFont] =
    useState<GeneratedHandwritingFont | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generatedFontUrl = useObjectUrl(generatedFont?.blob);
  const headerCopy = getDrawHeaderCopy(status);
  const activeStrokes = strokesByChar[activeChar] ?? [];
  const drawnCount = getDrawnChars(strokesByChar).length;
  const canGenerate = canGenerateDrawnFont(strokesByChar, status);

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
    <Workspace
      label="Drawing workspace"
      contentClassName={styles.workspace}
      footer={
        status !== "generated" && (
          <div
            aria-label="Drawing controls"
            className={workspaceFooterClass}
            role="group"
          >
            <div
              className={`${drawingRailClass} grid grid-cols-[1fr_1fr_1.5fr] gap-3`}
            >
              <ActionButton
                variant="secondary"
                disabled={activeStrokes.length === 0 || status === "generating"}
                onClick={undoStroke}
              >
                Undo
              </ActionButton>
              <ActionButton
                variant="secondary"
                disabled={activeStrokes.length === 0 || status === "generating"}
                onClick={clearActiveChar}
              >
                Clear
              </ActionButton>
              <ActionButton
                variant="primary"
                disabled={status === "generating"}
                onClick={goToNextChar}
              >
                Next letter
              </ActionButton>
            </div>
          </div>
        )
      }
    >
      <WorkspaceHeader href="/upload">Use a photo instead</WorkspaceHeader>
      <WorkspaceIntro title={headerCopy.title} subtitle={headerCopy.subtitle} />
      {status === "generated" && generatedFont && generatedFontUrl ? (
        <>
          <FontReview
            error={error}
            fontUrl={generatedFontUrl}
            generatedFont={generatedFont}
          />
          <div className="my-4 grid grid-cols-2 gap-3">
            <ActionButton variant="secondary" onClick={startOver}>
              Draw again
            </ActionButton>
            <FontDownload
              fileName={generatedFont.fileName}
              url={generatedFontUrl}
            />
          </div>
        </>
      ) : (
        <>
          <div className={`${drawingRailClass} mt-6`}>
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
    </Workspace>
  );
}
