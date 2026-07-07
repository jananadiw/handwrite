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
import { generateHandwritingFontInWorker } from "@/lib/font/generate-handwriting-font-in-worker";
import type { GeneratedHandwritingFont } from "@/lib/font/types";
import {
  MAX_SOURCE_IMAGE_BYTES,
  type NormalisedJpeg,
  normaliseToJpeg,
} from "@/lib/images/normalise-to-jpeg";
import type {
  AlphabetAnalysis,
  AnalysisSource,
} from "@/lib/extraction/schemas";

export function UploadPhotoForm() {
  const inputId = useId();
  const guidelinesId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [normalisedPhoto, setNormalisedPhoto] =
    useState<NormalisedJpeg | null>(null);
  const [analysis, setAnalysis] = useState<AlphabetAnalysis | null>(null);
  const [analysisSource, setAnalysisSource] =
    useState<AnalysisSource>("alphabet");
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
  const headerCopy = getUploadHeaderCopy(
    status,
    Boolean(sourceFile),
    analysisSource,
  );
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
      const photoAnalysis = await analyzePhoto(
        normalisedPhoto.file,
        analysisSource,
      );

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
              <AnalysisSourcePicker
                disabled={processing}
                onChange={setAnalysisSource}
                value={analysisSource}
              />
              <PhotoDropZone
                describedById={guidelinesId}
                inputId={inputId}
                onDrop={handleDrop}
              />
              {analysisSource === "declaration-demo" ? (
                <DeclarationDemoGuidelines id={guidelinesId} />
              ) : (
                <>
                  <UploadLimitNotice />
                  <PhotoGuidelines id={guidelinesId} />
                  <AlphabetSample />
                </>
              )}
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

function AnalysisSourcePicker({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (value: AnalysisSource) => void;
  value: AnalysisSource;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-medium text-ink">Source</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          aria-pressed={value === "alphabet"}
          className={sourceButtonClassName(value === "alphabet")}
          disabled={disabled}
          onClick={() => onChange("alphabet")}
          type="button"
        >
          Alphabet sample
        </button>
        <button
          aria-pressed={value === "declaration-demo"}
          className={sourceButtonClassName(value === "declaration-demo")}
          disabled={disabled}
          onClick={() => onChange("declaration-demo")}
          type="button"
        >
          July 4 demo
        </button>
      </div>
    </fieldset>
  );
}

function sourceButtonClassName(selected: boolean) {
  return `px-3 py-2 text-sm font-medium ring-1 transition ${
    selected
      ? "bg-button text-white ring-button"
      : "bg-linen/80 text-ink ring-ink/12 hover:bg-periwinkle"
  }`;
}

function DeclarationDemoGuidelines({ id }: { id: string }) {
  return (
    <div
      className="mt-4 bg-periwinkle/60 px-4 py-4 text-left ring-1 ring-ink/8"
      id={id}
    >
      <p className="text-sm font-medium leading-5 text-ink">
        Upload the Declaration screenshot for the July 4 demo.
      </p>
      <p className="mt-1 text-sm font-light leading-5 text-subtitle">
        This mode uses curated letter boxes from the provided document image so
        the demo can generate a deterministic .ttf without model training.
      </p>
    </div>
  );
}
