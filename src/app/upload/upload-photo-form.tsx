"use client";

import Link from "next/link";
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
import { generateHandwritingFontInWorker } from "@/lib/font/generate-handwriting-font-in-worker";
import type { GeneratedHandwritingFont } from "@/lib/font/types";
import {
  MAX_SOURCE_IMAGE_BYTES,
  type NormalisedJpeg,
  normaliseToJpeg,
} from "@/lib/images/normalise-to-jpeg";
import type { AlphabetAnalysis } from "@/lib/extraction/schemas";

export function UploadPhotoForm() {
  const inputId = useId();
  const guidelinesId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [normalisedPhoto, setNormalisedPhoto] =
    useState<NormalisedJpeg | null>(null);
  const [analysis, setAnalysis] = useState<AlphabetAnalysis | null>(null);
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
    setStatus("normalising");
    setSourceFile(file);
    setNormalisedPhoto(null);
    setAnalysis(null);
    setGeneratedFont(null);
    setError(null);

    if (!isPhotoFile(file)) {
      setStatus("error");
      setError("Choose a photo file from your phone.");
      return;
    }

    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      setStatus("error");
      setError("That photo is too large. Try another photo from your phone.");
      return;
    }

    try {
      const normalised = await normaliseToJpeg(file);
      setNormalisedPhoto(normalised);
      setStatus("ready");
    } catch {
      setStatus("error");
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
    setStatus("idle");
    setSourceFile(null);
    setNormalisedPhoto(null);
    setAnalysis(null);
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

  async function handleContinue() {
    if (!normalisedPhoto) {
      inputRef.current?.click();
      return;
    }

    setStatus("analyzing");
    setAnalysis(null);
    setGeneratedFont(null);
    setError(null);
    let reachedGeneration = false;

    try {
      const photoAnalysis = await analyzePhoto(normalisedPhoto.file);

      if (!photoAnalysis.usable) {
        setStatus("ready");
        setError(
          photoAnalysis.rejectReason ||
            "That photo is not clear enough to generate a font.",
        );
        return;
      }

      setAnalysis(photoAnalysis);
      setStatus("generating");
      reachedGeneration = true;

      const font = await generateHandwritingFontInWorker({
        analysis: photoAnalysis,
        normalisedPhoto,
      });

      setGeneratedFont(font);
      setStatus("generated");
    } catch (caughtError) {
      setStatus(reachedGeneration ? "analyzed" : "ready");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not finish your font. Try another clear photo.",
      );
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[680px] items-center justify-center">
      <div className="flex w-full flex-col gap-3">
        <div
          aria-busy={processing}
          className="bg-stone/92 px-5 py-6 shadow-[0_16px_48px_rgba(43,38,34,0.07)] ring-1 ring-ink/[0.05] backdrop-blur-[2px] sm:px-8 sm:py-8"
        >
          {!sourceFile ? (
            <Link
              className="inline-flex min-h-11 items-center text-sm font-medium text-subtitle transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2"
              href="/"
            >
              <span aria-hidden="true" className="mr-2">
                ←
              </span>
              Back
            </Link>
          ) : null}

          <div className={sourceFile ? "text-center" : "mt-5 text-left sm:mt-7"}>
            <h1 className="font-serif text-[32px] font-bold italic leading-tight tracking-[-0.02em] text-title sm:text-[40px]">
              {headerCopy.title}
            </h1>
            <p
              className={`mt-2 text-base font-light leading-7 text-subtitle ${
                sourceFile ? "" : "max-w-[480px]"
              }`}
            >
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
              <PhotoGuidelines id={guidelinesId} />
              <div className="mt-4 border-t border-ink/8 pt-4">
                <UploadLimitNotice />
                <AlphabetSample />
              </div>
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
              analysis={analysis}
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

        {sourceFile ? (
          <UploadActions
            generatedFont={generatedFont}
            generatedFontUrl={generatedFontUrl}
            normalisedPhoto={normalisedPhoto}
            onPrimaryAction={() => void handleContinue()}
            onSecondaryAction={
              status === "generated" ? handleUploadAnotherPhoto : undefined
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
