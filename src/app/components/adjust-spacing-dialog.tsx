"use client";

import {
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ActionButton, actionClass } from "./action-button";
import { getSpacingPreview } from "../upload/font-preview-text";
import type { GeneratedHandwritingFont } from "@/lib/font/generate-handwriting-font";
import {
  adjustFontLetterSpacing,
  formatLetterSpacingEm,
  LETTER_SPACING_MAX_EM,
  LETTER_SPACING_MIN_EM,
  LETTER_SPACING_STEP_EM,
} from "@/lib/font/adjust-letter-spacing";

const dialogActionFocusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2";

const PREVIEW_DEBOUNCE_MS = 120;
const FOCUSABLE_ELEMENT_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
const DOWNLOAD_ERROR_MESSAGE =
  "We couldn't prepare the adjusted font. Try again.";

type AdjustedPreview = {
  familyName: string;
  letterSpacingEm: number;
  url: string;
};

type DownloadLink = Pick<HTMLAnchorElement, "click" | "download" | "href">;

type AdjustedFontDownloadDependencies = {
  adjustFont: typeof adjustFontLetterSpacing;
  createLink: () => DownloadLink;
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  scheduleRevoke: (callback: () => void) => void;
};

const browserDownloadDependencies: AdjustedFontDownloadDependencies = {
  adjustFont: adjustFontLetterSpacing,
  createLink: () => document.createElement("a"),
  createObjectUrl: (blob) => URL.createObjectURL(blob),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
  scheduleRevoke: (callback) => void window.setTimeout(callback, 0),
};

export async function downloadAdjustedFont(
  {
    fileName,
    fontBlob,
    letterSpacingEm,
  }: {
    fileName: string;
    fontBlob: Blob;
    letterSpacingEm: number;
  },
  dependencies: AdjustedFontDownloadDependencies = browserDownloadDependencies,
) {
  const adjustedBlob = await dependencies.adjustFont(fontBlob, {
    letterSpacingEm,
  });
  const downloadUrl = dependencies.createObjectUrl(adjustedBlob);
  const link = dependencies.createLink();

  link.href = downloadUrl;
  link.download = fileName.replace(/\.ttf$/i, "-adjusted.ttf");
  link.click();
  dependencies.scheduleRevoke(() =>
    dependencies.revokeObjectUrl(downloadUrl),
  );
}

export function AdjustSpacingDialog({
  generatedFont,
  fontUrl,
  onClose,
}: {
  generatedFont: GeneratedHandwritingFont;
  fontUrl: string;
  onClose: () => void;
}) {
  const fontBlob = generatedFont.blob;
  const spacingPreview = getSpacingPreview(generatedFont.generatedLetters);
  const fontId = useId().replace(/\W/g, "");
  const originalFamily = `handwrite-spacing-original-${fontId}`;
  const adjustedFamily = `handwrite-spacing-adjusted-${fontId}`;
  const [letterSpacingEm, setLetterSpacingEm] = useState(0);
  const [adjustedPreview, setAdjustedPreview] =
    useState<AdjustedPreview | null>(null);
  const adjustedUrlRef = useRef<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const adjustedLabel = adjustedPreview
    ? `ADJUSTED · ${formatLetterSpacingEm(adjustedPreview.letterSpacingEm)}`
    : "ADJUSTED";

  // The adjusted panel renders the same font the download produces, so a
  // browser-side approximation can never disagree with the exported file.
  useEffect(() => {
    let cancelled = false;

    async function buildAdjustedPreview() {
      const adjustedBlob = await adjustFontLetterSpacing(fontBlob, {
        letterSpacingEm,
      });

      if (cancelled) {
        return;
      }

      const url = URL.createObjectURL(adjustedBlob);

      if (adjustedUrlRef.current) {
        URL.revokeObjectURL(adjustedUrlRef.current);
      }

      adjustedUrlRef.current = url;
      setAdjustedPreview({
        // A fresh family name per setting stops the browser reusing the
        // previously loaded face for an identical name.
        familyName: `${adjustedFamily}-${letterSpacingEm.toFixed(2)}`,
        letterSpacingEm,
        url,
      });
    }

    const timer = setTimeout(() => void buildAdjustedPreview(), PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [adjustedFamily, fontBlob, letterSpacingEm]);

  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    closeButtonRef.current?.focus();

    return () => {
      if (adjustedUrlRef.current) {
        URL.revokeObjectURL(adjustedUrlRef.current);
        adjustedUrlRef.current = null;
      }

      opener?.focus();
    };
  }, []);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        FOCUSABLE_ELEMENT_SELECTOR,
      ),
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  async function handleDownload() {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      await downloadAdjustedFont({
        fileName: generatedFont.fileName,
        fontBlob,
        letterSpacingEm,
      });
    } catch {
      setDownloadError(DOWNLOAD_ERROR_MESSAGE);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-6">
      <button
        aria-label="Close spacing dialog"
        className="absolute inset-0 bg-ink/20 backdrop-blur-[3px]"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <section
        aria-labelledby={`adjust-spacing-title-${fontId}`}
        aria-modal="true"
        className="relative flex max-h-[min(92dvh,860px)] w-full max-w-[760px] flex-col overflow-hidden bg-stone shadow-[0_24px_80px_rgba(43,38,34,0.20)] ring-1 ring-ink/10"
        onKeyDown={handleDialogKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/8 px-5 py-5 sm:px-6">
          <div>
            <h2
              className="font-serif text-2xl font-bold italic leading-tight text-title"
              id={`adjust-spacing-title-${fontId}`}
            >
              Adjust spacing
            </h2>
            <p className="mt-2 max-w-[34rem] text-sm leading-6 text-subtitle">
              Compare the original font with your changes, then download a new
              TTF.
            </p>
          </div>
          <button
            aria-label="Close"
            className={`inline-flex h-10 w-10 items-center justify-center text-subtitle transition-colors hover:bg-linen hover:text-ink ${dialogActionFocusClass}`}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto overscroll-y-contain px-5 py-5 sm:px-6">
          <style>{`
            @font-face {
              font-family: "${originalFamily}";
              src: url("${fontUrl}") format("truetype");
              font-display: block;
            }
            ${
              adjustedPreview
                ? `@font-face {
              font-family: "${adjustedPreview.familyName}";
              src: url("${adjustedPreview.url}") format("truetype");
              font-display: block;
            }`
                : ""
            }
          `}</style>

          <div className="grid gap-4 md:grid-cols-2">
            <SpacingPreviewPanel
              familyName={originalFamily}
              label="Original"
              text={spacingPreview.text}
            />
            <SpacingPreviewPanel
              familyName={adjustedPreview?.familyName ?? null}
              label={adjustedLabel}
              text={spacingPreview.text}
            />
          </div>

          {spacingPreview.notice ? (
            <p className="mt-3 text-sm leading-5 text-muted">
              {spacingPreview.notice}
            </p>
          ) : null}

          <div className="mt-5 border border-ink/10 bg-white/70 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <label
                className="text-sm font-medium text-ink"
                htmlFor={`letter-spacing-${fontId}`}
              >
                Letter spacing
              </label>
              <span className="text-sm tabular-nums text-subtitle">
                {formatLetterSpacingEm(letterSpacingEm)}
              </span>
            </div>
            <input
              aria-valuetext={formatLetterSpacingEm(letterSpacingEm)}
              className="mt-3 h-2 w-full cursor-pointer accent-ink"
              id={`letter-spacing-${fontId}`}
              max={LETTER_SPACING_MAX_EM}
              min={LETTER_SPACING_MIN_EM}
              onChange={(event) =>
                setLetterSpacingEm(Number(event.target.value))
              }
              step={LETTER_SPACING_STEP_EM}
              type="range"
              value={letterSpacingEm}
            />
            <div className="mt-2 flex justify-between text-xs tabular-nums text-muted">
              <span>{formatLetterSpacingEm(LETTER_SPACING_MIN_EM)}</span>
              <span>{formatLetterSpacingEm(LETTER_SPACING_MAX_EM)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-ink/8">
          {downloadError ? (
            <p
              aria-live="assertive"
              className="px-5 pt-4 text-sm font-medium leading-5 text-coral sm:px-6"
              role="alert"
            >
              {downloadError}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <ActionButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </ActionButton>
            <button
              aria-busy={isDownloading}
              className={`${actionClass("primary")} sm:min-w-[220px]`}
              disabled={isDownloading}
              onClick={() => void handleDownload()}
              type="button"
            >
              <span aria-hidden="true">↓</span>
              {isDownloading ? "Preparing…" : "Download adjusted TTF"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SpacingPreviewPanel({
  familyName,
  label,
  text,
}: {
  familyName: string | null;
  label: string;
  text: string;
}) {
  return (
    <div className="overflow-hidden border border-ink/10 bg-white">
      <div className="border-b border-ink/8 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          {label}
        </p>
      </div>
      <div className="px-4 py-5">
        <p
          className="text-[22px] leading-[1.15] text-ink sm:text-[26px]"
          style={{
            fontFamily: familyName ? `"${familyName}", serif` : "serif",
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
