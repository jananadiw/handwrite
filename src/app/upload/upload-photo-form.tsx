"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlphabetSample } from "./alphabet-sample";
import { analyzePhoto } from "./analyze-photo";
import { FontReview } from "./font-review";
import { PhotoDropZone } from "./photo-drop-zone";
import { PhotoGuidelines } from "./photo-guidelines";
import { ReplaceFontDialog } from "./replace-font-dialog";
import { UploadActions } from "./upload-actions";
import { UploadLimitNotice } from "./upload-limit-notice";
import { UploadState } from "./upload-state";
import { UploadStepIndicator } from "./upload-step-indicator";
import {
  getUploadHeaderCopy,
  isUploadProcessing,
  shouldShowUploadSteps,
} from "./upload-helpers";
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
  const showSteps = shouldShowUploadSteps(status, Boolean(sourceFile));
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
    <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[720px] items-center justify-center">
      <div className="flex w-full flex-col gap-4">
        <div
          aria-busy={processing}
          className="bg-stone/95 px-5 py-6 shadow-[0_12px_36px_rgba(43,38,34,0.08)] sm:px-7 sm:py-7"
        >
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold italic leading-tight tracking-normal text-title sm:text-[38px]">
              {headerCopy.title}
            </h1>
            <p className="mt-2 text-base font-light leading-7 text-subtitle">
              {headerCopy.subtitle}
            </p>
          </div>

          {showSteps ? <UploadStepIndicator status={status} /> : null}

          {!sourceFile ? (
            <>
              <PhotoDropZone
                describedById={guidelinesId}
                inputId={inputId}
                onDrop={handleDrop}
              />
              <UploadLimitNotice />
              <PhotoGuidelines id={guidelinesId} />
              <AlphabetSample />
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
              generatedFont={generatedFont}
              fontUrl={generatedFontUrl}
            />
          ) : null}

          {error ? (
            <p
              aria-live="assertive"
              className="mt-4 text-sm font-medium leading-6 text-coral"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

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
