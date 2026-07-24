"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { analyzePhoto } from "./analyze-photo";
import { FontReview } from "./font-review";
import { PhotoDropZone } from "./photo-drop-zone";
import { PhotoGuidelines } from "./photo-guidelines";
import { ReplaceFontDialog } from "./replace-font-dialog";
import { UploadActions } from "./upload-actions";
import { UploadState } from "./upload-state";
import { getUploadHeaderCopy, isUploadProcessing } from "./upload-helpers";
import type { UploadStatus } from "./upload-types";
import {
  createHandwritingFontSource,
  generateHandwritingFontInWorker,
} from "@/lib/font/generate-handwriting-font-in-worker";
import type {
  GeneratedHandwritingFont,
  HandwritingFontSource,
} from "@/lib/font/types";
import {
  MAX_SOURCE_IMAGE_BYTES,
  type NormalisedJpeg,
  normaliseToJpeg,
} from "@/lib/images/normalise-to-jpeg";
import type { AlphabetAnalysis } from "@/lib/extraction/schemas";

type CaptureMode = "initial" | "supplemental";

export function UploadPhotoForm() {
  const inputId = useId();
  const guidelinesId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const captureModeRef = useRef<CaptureMode>("initial");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [normalisedPhoto, setNormalisedPhoto] =
    useState<NormalisedJpeg | null>(null);
  const [analysis, setAnalysis] = useState<AlphabetAnalysis | null>(null);
  const [fontSources, setFontSources] = useState<HandwritingFontSource[]>([]);
  const [generatedFont, setGeneratedFont] =
    useState<GeneratedHandwritingFont | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReplaceFontDialog, setShowReplaceFontDialog] = useState(false);
  const normalisedPhotoUrl = useMemo(
    () => (normalisedPhoto ? URL.createObjectURL(normalisedPhoto.blob) : null),
    [normalisedPhoto],
  );
  const generatedFontUrl = useMemo(
    () => (generatedFont ? URL.createObjectURL(generatedFont.blob) : null),
    [generatedFont],
  );
  const headerCopy = getUploadHeaderCopy(status, Boolean(sourceFile));
  const processing = isUploadProcessing(status);
  const hasMissingGlyphs = Boolean(generatedFont?.missingLetters.length);

  useEffect(() => {
    if (!normalisedPhotoUrl) {
      return;
    }

    return () => URL.revokeObjectURL(normalisedPhotoUrl);
  }, [normalisedPhotoUrl]);

  useEffect(() => {
    if (!generatedFontUrl) {
      return;
    }

    return () => URL.revokeObjectURL(generatedFontUrl);
  }, [generatedFontUrl]);

  async function preparePhoto(file: File) {
    const captureMode = captureModeRef.current;

    setStatus("normalising");
    setSourceFile(file);
    setNormalisedPhoto(null);
    setAnalysis(null);
    setError(null);

    if (captureMode === "initial") {
      setGeneratedFont(null);
      setFontSources([]);
    }

    if (!isPhotoFile(file)) {
      setStatus(captureMode === "supplemental" ? "generated" : "error");
      setError("Choose a photo file from your phone.");
      return;
    }

    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      setStatus(captureMode === "supplemental" ? "generated" : "error");
      setError("That photo is too large. Try another photo from your phone.");
      return;
    }

    try {
      const normalised = await normaliseToJpeg(file);
      setNormalisedPhoto(normalised);
      setStatus("ready");
    } catch {
      setStatus(captureMode === "supplemental" ? "generated" : "error");
      setError("We could not read that photo. Try another phone photo.");
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];

    if (!file) {
      return;
    }

    void preparePhoto(file);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  }

  function resetUpload() {
    captureModeRef.current = "initial";
    setStatus("idle");
    setSourceFile(null);
    setNormalisedPhoto(null);
    setAnalysis(null);
    setFontSources([]);
    setGeneratedFont(null);
    setError(null);
    setShowReplaceFontDialog(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleUploadAnotherPhoto() {
    if (generatedFont && generatedFontUrl) {
      setShowReplaceFontDialog(true);
      return;
    }

    resetUpload();
    window.setTimeout(() => inputRef.current?.click(), 0);
  }

  function confirmUploadAnotherPhoto() {
    resetUpload();
    window.setTimeout(() => inputRef.current?.click(), 0);
  }

  function handleAddMissingLetters() {
    captureModeRef.current = "supplemental";
    setError(null);
    window.setTimeout(() => inputRef.current?.click(), 0);
  }

  async function handleContinue() {
    if (!normalisedPhoto) {
      captureModeRef.current = "initial";
      inputRef.current?.click();
      return;
    }

    const captureMode = captureModeRef.current;
    const supplemental = captureMode === "supplemental" && fontSources.length > 0;

    setStatus("analyzing");
    setAnalysis(null);
    if (!supplemental) {
      setGeneratedFont(null);
      setFontSources([]);
    }
    setError(null);
    let reachedGeneration = false;

    try {
      const photoAnalysis = await analyzePhoto(normalisedPhoto.file);

      if (!photoAnalysis.usable) {
        setStatus(supplemental ? "generated" : "ready");
        setError(
          photoAnalysis.rejectReason ||
            "That photo is not clear enough to generate a font.",
        );
        return;
      }

      const nextSource = createHandwritingFontSource({
        analysis: photoAnalysis,
        normalisedPhoto,
      });
      const nextFontSources = supplemental
        ? [...fontSources, nextSource]
        : [nextSource];

      setAnalysis(photoAnalysis);
      setStatus("generating");
      reachedGeneration = true;

      const font = await generateHandwritingFontInWorker({
        sources: nextFontSources,
      });

      captureModeRef.current = "initial";
      setFontSources(nextFontSources);
      setGeneratedFont(font);
      setStatus("generated");
    } catch (caughtError) {
      setStatus(
        supplemental ? "generated" : reachedGeneration ? "analyzed" : "ready",
      );
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not finish your font. Try another clear photo.",
      );
    }
  }

  return (
    <section
      className={`mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[680px] items-start justify-center sm:min-h-[calc(100vh-5rem)] sm:items-center ${
        sourceFile ? "pb-24 sm:pb-0" : ""
      }`}
    >
      <div className="w-full bg-stone/95 px-5 py-5 shadow-[0_18px_50px_rgba(43,38,34,0.08)] ring-1 ring-ink/[0.06] backdrop-blur-[2px] sm:px-8 sm:py-7">
        <header className="flex items-center justify-between">
          <Link
            aria-label="HandWrite home"
            className="inline-flex min-h-11 items-center font-serif text-xl font-bold italic tracking-[-0.02em] text-title transition-colors hover:text-subtitle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-4"
            href="/"
          >
            HandWrite
          </Link>
        </header>

        <div
          aria-busy={processing}
          className="mt-8 sm:mt-10"
        >
          <div className="text-left">
            <h1 className="max-w-[600px] font-serif text-[36px] font-bold italic leading-[1.12] tracking-[-0.025em] text-title sm:text-[46px]">
              {headerCopy.title}
            </h1>
            {headerCopy.subtitle ? (
              <p className="mt-3 max-w-[480px] text-base leading-7 text-subtitle">
                {headerCopy.subtitle}
              </p>
            ) : null}
          </div>

          {!sourceFile ? (
            <>
              <PhotoDropZone
                describedById={guidelinesId}
                inputId={inputId}
                onDrop={handleDrop}
              />
              <PhotoGuidelines id={guidelinesId} />
            </>
          ) : null}

          <input
            accept="image/*"
            className="sr-only"
            id={inputId}
            onChange={(event) => handleFiles(event.target.files)}
            ref={inputRef}
            type="file"
          />

          {status !== "generated" ? (
            <UploadState
              analysis={analysis}
              error={error}
              file={sourceFile}
              normalisedPhoto={normalisedPhoto}
              onChangePhoto={
                processing ? undefined : () => inputRef.current?.click()
              }
              photoPreviewUrl={normalisedPhotoUrl}
              status={status}
            />
          ) : null}

          {status === "generated" && generatedFont && generatedFontUrl ? (
            <FontReview
              error={error}
              generatedFont={generatedFont}
              fontUrl={generatedFontUrl}
            />
          ) : null}
        </div>

        {sourceFile ? (
          <UploadActions
            generatedFont={generatedFont}
            generatedFontUrl={generatedFontUrl}
            normalisedPhoto={normalisedPhoto}
            onPrimaryAction={() => void handleContinue()}
            onSecondaryAction={
              status === "generated"
                ? hasMissingGlyphs
                  ? handleAddMissingLetters
                  : handleUploadAnotherPhoto
                : undefined
            }
            secondaryActionLabel={
              hasMissingGlyphs ? "Add missing letters" : "Upload another photo"
            }
            status={status}
          />
        ) : null}

        {showReplaceFontDialog && generatedFont && generatedFontUrl ? (
          <ReplaceFontDialog
            fontUrl={generatedFontUrl}
            generatedFont={generatedFont}
            onCancel={() => setShowReplaceFontDialog(false)}
            onConfirm={confirmUploadAnotherPhoto}
          />
        ) : null}
      </div>
    </section>
  );
}

function isPhotoFile(file: File) {
  return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}
